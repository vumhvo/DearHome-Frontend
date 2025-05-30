import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Switch, Upload, App } from 'antd';
import { UploadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { CategoryApiRequest, PlacementApiRequest, AttributeApiRequest, UploadApiRequest, ProductApiRequest, shapeGenerateApiRequest } from '../../../api/ApiRequests';
import ModelPreview from '../../../components/ModelPreview';
import ErrorBoundary from '../../../components/ErrorBoundary';

const { Option } = Select;

const AddProduct = ({ open, onCancel, onSubmit }) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [categories, setCategories] = useState([]);
    const [placements, setPlacements] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [uploadedImageUrl, setUploadedImageUrl] = useState('');
    const [modelPreviewUrl, setModelPreviewUrl] = useState(null);
    const [modelUrl, setModelUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [generating3DModel, setGenerating3DModel] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchPlacements();
        fetchAttributes();
    }, []);

    const fetchCategories = async () => {
            try {
                const response = await CategoryApiRequest.getAllCategories();
                const categoriesData = response.data.$values || [];
                
                // Process categories to handle parent-child relationships
                const processedCategories = [];
                
                // Add parent categories and their subcategories
                categoriesData.forEach(category => {
                    // Skip categories that are already added as subcategories (using $ref in the API response)
                    if (category.$ref) return;
                    
                    // Add parent category
                    processedCategories.push(category);
                    
                    // Add subcategories if they exist
                    if (category.subCategories && category.subCategories.$values && category.subCategories.$values.length > 0) {
                        category.subCategories.$values.forEach(subCategory => {
                            // Add subcategory with modified name to show hierarchy
                            processedCategories.push({
                                ...subCategory,
                                displayName: `── ${subCategory.name}` // Add indentation to show it's a subcategory
                            });
                        });
                    }
                });
                
                setCategories(processedCategories);
            } catch (error) {
                message.error('Failed to fetch categories');
                console.error(error);
            }
        };

    const fetchPlacements = async () => {
        try {
            const response = await PlacementApiRequest.getAllPlacements();
            setPlacements(response.data.$values || []);
        } catch (error) {
            message.error('Failed to fetch placements');
            console.error(error);
        }
    };

    const fetchAttributes = async () => {
        try {
            const response = await AttributeApiRequest.getAllAttributes();
            setAttributes(response.data.$values || []);
        } catch (error) {
            message.error('Failed to fetch attributes');
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            // Use the already uploaded image URL if available
            let imageUrl = uploadedImageUrl;
            
            // If we don't have an uploaded URL but have a file, try uploading it now (fallback)
            if (!imageUrl && fileList.length > 0 && fileList[0].originFileObj) {
                const formData = new FormData();
                formData.append('file', fileList[0].originFileObj);
                const uploadResponse = await UploadApiRequest.uploadImage(formData);
                imageUrl = uploadResponse.data;
            }

            // Prepare attribute values
            const attributeValues = [];
            if (selectedCategory) {
                const categoryAttributes = categories.find(c => c.id === selectedCategory)?.attributes?.$values || [];

                categoryAttributes.forEach(attr => {
                    const value = values[`attribute_${attr.id}`];
                    if (value) {
                        attributeValues.push({
                            value,
                            attributeId: attr.id
                        });
                    }
                });
            }

            const productData = {
                imageUrl,
                modelUrl: modelUrl, // Use the generated model URL
                name: values.name,
                price: values.price,
                description: values.description,
                isActive: values.isActive !== false, // Default to true if undefined
                categoryId: values.categoryId,
                placementId: values.placementId,
                status: values.isActive !== false ? 'Active' : 'Inactive',
                attributeValues
            };

            await ProductApiRequest.createProduct(productData).then(
                (response) => {
                    message.success('Product created successfully');
                    onSubmit(productData);
                    form.resetFields();
                    setFileList([]);
                    setUploadedImageUrl('');
                    if (modelPreviewUrl) {
                        // Only revoke object URLs, not Firebase URLs
                        if (modelPreviewUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(modelPreviewUrl);
                        }
                        setModelPreviewUrl(null);
                    }
                    setModelUrl('');
                    setSelectedCategory(null);
                },
                (error) => {
                    message.error('Failed to create product');
                    console.error(error);
                }
            );
        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        form.resetFields(['attributeValues']);
    };

    const handleFileChange = async ({ fileList }) => {
        setFileList(fileList);
        
        // If a file was selected, upload it immediately
        if (fileList.length > 0 && fileList[0].originFileObj) {
            try {
                setLoading(true);
                const formData = new FormData();
                formData.append('file', fileList[0].originFileObj);
                const uploadResponse = await UploadApiRequest.uploadImage(formData);
                const imageUrl = uploadResponse.data;
                
                setUploadedImageUrl(imageUrl);
                message.success('Image uploaded successfully');
                
                // Update file object with URL info
                const newFileList = [...fileList];
                newFileList[0].status = 'done';
                newFileList[0].url = imageUrl;
                setFileList(newFileList);
            } catch (error) {
                console.error('Error uploading image:', error);
                message.error('Failed to upload image: ' + (error.message || 'Unknown error'));
                
                // Mark file as error
                const newFileList = [...fileList];
                newFileList[0].status = 'error';
                setFileList(newFileList);
            } finally {
                setLoading(false);
            }
        } else {
            // If no file is selected, clear the uploaded URL
            setUploadedImageUrl('');
        }
    };

    const getCategoryAttributes = () => {
        if (!selectedCategory) return [];
        const category = categories.find(c => c.id === selectedCategory);
        return category?.attributes?.$values || [];
    };

    // Generate 3D model from image
    const handleGenerate3DModel = async () => {
        if (!uploadedImageUrl) {
            message.error('Please upload an image first');
            return;
        }

        try {
            setGenerating3DModel(true);
            message.loading('Generating 3D model from image. This may take a minute...', 0);

            // Call the shape generation API with the image URL
            const response = await shapeGenerateApiRequest.generateShape({
                caption: 'shape',
                image_path: uploadedImageUrl,
            });

            if (response.data && response.data.storage_file_path) {
                // Get the shape URL from the response
                const shapeUrl = response.data.storage_file_path;
                setModelUrl(shapeUrl);
                setModelPreviewUrl(shapeUrl);
                message.success('3D model generated successfully');
                
                // Update the form values
                form.setFieldsValue({ modelUrl: shapeUrl });
            } else {
                throw new Error('Failed to generate 3D model');
            }
        } catch (error) {
            console.error('Error generating 3D model:', error);
            message.error('Failed to generate 3D model: ' + (error.message || 'Unknown error'));
        } finally {
            setGenerating3DModel(false);
            message.destroy(); // Clear the loading message
        }
    };

    return (
        <Modal
            open={open}
            title="Add New Product"
            okText="Add"
            cancelText="Cancel"
            onCancel={onCancel}
            onOk={handleSubmit}
            width={800}
            confirmLoading={loading}
        >
            <Form
                form={form}
                layout="vertical"
                name="add_product_form"
                initialValues={{ isActive: true }}
            >
                <Form.Item
                    name="image"
                    label="Product Image"
                >
                    <Upload
                        listType="picture-card"
                        maxCount={1}
                        fileList={fileList}
                        beforeUpload={() => false}
                        onChange={handleFileChange}
                    >
                        <UploadOutlined />
                    </Upload>
                    {uploadedImageUrl && (
                        <div style={{ marginTop: 8, color: 'green' }}>
                            Image uploaded successfully ✓
                        </div>
                    )}
                </Form.Item>

                {uploadedImageUrl && (
                    <Form.Item
                        name="3dModel"
                        label="3D Model"
                    >
                        {modelPreviewUrl ? (
                            <div>
                                <div style={{ marginBottom: 16 }}>
                                    <Button 
                                        type="primary" 
                                        onClick={handleGenerate3DModel}
                                        loading={generating3DModel}
                                        icon={<CloudUploadOutlined />}
                                    >
                                        Regenerate 3D Model
                                    </Button>
                                </div>
                                <div style={{ height: 300, border: '1px solid #d9d9d9', borderRadius: 2, overflow: 'hidden' }}>
                                    <ErrorBoundary>
                                        <ModelPreview modelPath={modelPreviewUrl} />
                                    </ErrorBoundary>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <Button 
                                    type="primary" 
                                    onClick={handleGenerate3DModel}
                                    loading={generating3DModel}
                                    icon={<CloudUploadOutlined />}
                                >
                                    Generate 3D Model from Image
                                </Button>
                                <p style={{ marginTop: 8, color: 'gray', fontStyle: 'italic' }}>
                                    Our AI will automatically generate a 3D model based on your product image
                                </p>
                            </div>
                        )}
                    </Form.Item>
                )}

                <Form.Item
                    name="name"
                    label="Product Name"
                    rules={[{ required: true, message: 'Please input product name!' }]}
                >
                    <Input placeholder="Enter product name" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please input product description!' }]}
                >
                    <Input.TextArea rows={4} placeholder="Enter product description" />
                </Form.Item>

                <Form.Item
                    name="price"
                    label="Price"
                    rules={[{ required: true, message: 'Please input price!' }]}
                >
                    <InputNumber
                        prefix="$"
                        min={0}
                        step={0.01}
                        style={{ width: '100%' }}
                        placeholder="Enter price"
                    />
                </Form.Item>

                <Form.Item
                    name="categoryId"
                    label="Category"
                    rules={[{ required: true, message: 'Please select category!' }]}
                >
                    <Select
                        placeholder="Select category"
                        onChange={handleCategoryChange}
                    >
                        {categories.map(category => (
                            <Option key={category.id} value={category.id}>{category.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="placementId"
                    label="Placement"
                    rules={[{ required: true, message: 'Please select placement!' }]}
                >
                    <Select placeholder="Select placement">
                        {placements.map(placement => (
                            <Option key={placement.id} value={placement.id}>{placement.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="isActive"
                    label="Status"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
                </Form.Item>

                {getCategoryAttributes().length > 0 && (
                    <>
                        <div style={{ marginBottom: 16 }}>
                            <h3>Attributes</h3>
                        </div>
                        {getCategoryAttributes().map(attribute => (
                            <Form.Item
                                key={attribute.id}
                                name={`attribute_${attribute.id}`}
                                label={attribute.name}
                                rules={[{ required: true, message: `Please select ${attribute.name}!` }]}
                            >
                                <Select placeholder={`Select ${attribute.name}`}>
                                    {(attribute.values?.$values?.map(value => (
                                        <Option key={value} value={value}>{value}</Option>
                                    ))) || []}
                                </Select>
                            </Form.Item>
                        ))}
                    </>
                )}
            </Form>
        </Modal>
    );
};

export default AddProduct;
