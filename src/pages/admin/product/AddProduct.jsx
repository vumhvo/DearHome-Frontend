import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Switch, Upload, App, Radio } from 'antd';
import { UploadOutlined, LinkOutlined } from '@ant-design/icons';
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
    const [modelFileList, setModelFileList] = useState([]);
    const [modelPreviewUrl, setModelPreviewUrl] = useState(null);
    const [modelSource, setModelSource] = useState('local'); // 'local' or 'firebase'
    const [firebaseUrl, setFirebaseUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchPlacements();
        fetchAttributes();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await CategoryApiRequest.getAllWithParentAndAttributes();
            setCategories(response.data.$values || []);
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

            let imageUrl = '';
            if (fileList.length > 0) {
                const formData = new FormData();
                formData.append('file', fileList[0].originFileObj);
                const uploadResponse = await UploadApiRequest.uploadImage(formData);
                imageUrl = uploadResponse.data;
            }

            // Upload 3D model if provided
            let modelUrl = '';
            if (modelSource === 'local' && modelFileList.length > 0) {
                const modelFormData = new FormData();
                modelFormData.append('file', modelFileList[0].originFileObj);
                const modelUploadResponse = await UploadApiRequest.uploadModel(modelFormData);
                modelUrl = modelUploadResponse.data;
            } else if (modelSource === 'firebase' && firebaseUrl) {
                // Use the Firebase URL directly
                modelUrl = firebaseUrl;
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
                modelUrl,  // Add modelUrl to the product data
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
                    setModelFileList([]);
                    if (modelPreviewUrl) {
                        // Only revoke object URLs, not Firebase URLs
                        if (modelPreviewUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(modelPreviewUrl);
                        }
                        setModelPreviewUrl(null);
                    }
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

    const handleFileChange = ({ fileList }) => {
        setFileList(fileList);
    };

    const handleModelFileChange = ({ fileList }) => {
        setModelFileList(fileList);
        if (fileList.length > 0 && fileList[0].originFileObj) {
            // Create a URL for the uploaded file
            const url = URL.createObjectURL(fileList[0].originFileObj);
            setModelPreviewUrl(url);
        } else {
            setModelPreviewUrl(null);
        }
    };

    // Handle a Firebase URL directly
    const handleLoadFirebaseModel = async () => {
        try {
            setLoading(true);
            if (!firebaseUrl) {
                message.error('Please enter a valid Firebase model URL');
                return;
            }
            
            // Set the model preview URL directly
            setModelPreviewUrl(firebaseUrl);
            
            // Store the valid URL in the form
            form.setFieldsValue({ modelUrl: firebaseUrl });
            
            message.success('3D model URL loaded successfully');
            
        } catch (error) {
            console.error('Error setting Firebase model URL:', error);
            message.error('Failed to set 3D model URL: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleModelSourceChange = (e) => {
        const newSource = e.target.value;
        setModelSource(newSource);
        
        // Clear existing model data when switching sources
        if (newSource === 'local') {
            setFirebaseUrl('');
        } else {
            setModelFileList([]);
        }
        
        if (modelPreviewUrl && modelPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(modelPreviewUrl);
        }
        setModelPreviewUrl(null);
    };

    const getCategoryAttributes = () => {
        if (!selectedCategory) return [];
        const category = categories.find(c => c.id === selectedCategory);
        return category?.attributes?.$values || [];
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
                    rules={[{ required: true, message: 'Please upload product image!' }]}
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
                </Form.Item>
                <Form.Item
                    name="3dModel"
                    label="3D Model (Optional)"
                    rules={[{ required: false }]}
                >
                    <div>
                        <Radio.Group 
                            value={modelSource} 
                            onChange={handleModelSourceChange}
                            style={{ marginBottom: 16 }}
                        >
                            <Radio.Button value="local">Upload Model</Radio.Button>
                            <Radio.Button value="firebase">Firebase URL</Radio.Button>
                        </Radio.Group>
                        
                        {modelSource === 'local' ? (
                            <Upload
                                listType="text"
                                maxCount={1}
                                fileList={modelFileList}
                                beforeUpload={() => false}
                                onChange={handleModelFileChange}
                                accept=".glb,.gltf"
                            >
                                <Button icon={<UploadOutlined />}>Select 3D Model File</Button>
                            </Upload>
                        ) : (
                            <div>
                                <Input
                                    placeholder="Enter Firebase GLB model URL"
                                    value={firebaseUrl}
                                    onChange={(e) => setFirebaseUrl(e.target.value)}
                                    style={{ width: '100%', marginBottom: 8 }}
                                    prefix={<LinkOutlined />}
                                />
                                <Button 
                                    type="primary" 
                                    onClick={handleLoadFirebaseModel}
                                    disabled={!firebaseUrl}
                                >
                                    Load Firebase Model
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    {modelPreviewUrl && (
                        <div style={{ marginTop: 16, height: 300, border: '1px solid #d9d9d9', borderRadius: 2 }}>
                            <ModelPreview modelPath={modelPreviewUrl} />
                        </div>
                    )}
                </Form.Item>

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
                                    {attribute.values?.$values?.map(value => (
                                        <Option key={value} value={value}>{value}</Option>
                                    )) || []}
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
