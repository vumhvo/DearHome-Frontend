import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, Breadcrumb, Row, Col, Switch, Card, Flex, Typography, App, Slider, ColorPicker } from 'antd';
import { UploadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ProductApiRequest, CategoryApiRequest, PlacementApiRequest, AttributeApiRequest, UploadApiRequest, shapeGenerateApiRequest } from '../../../api/ApiRequests';
import ProductVariants from './ProductVariants';
import ModelPreview from '../../../components/ModelPreview';
import ErrorBoundary from '../../../components/ErrorBoundary';

const { Option } = Select;

const EditProduct = () => {
    const [productForm] = Form.useForm();
    const { message } = App.useApp();
    const navigate = useNavigate();
    const params = useParams();
    const { id } = params;

    const [attributes, setAttributes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [product, setProduct] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modelPreviewUrl, setModelPreviewUrl] = useState(null);
    const [modelUrl, setModelUrl] = useState('');
    const [generating3DModel, setGenerating3DModel] = useState(false);
    const [modelColor, setModelColor] = useState('#ffffff');
    const [modelMaterial, setModelMaterial] = useState({ 
        roughness: 0.5, 
        metalness: 0.5 
    });

    useEffect(() => {
        fetchProduct();
        fetchCategories();
        fetchPlacements();
    }, [id]);

    useEffect(() => {
        if (product) {
            productForm.setFieldsValue({
                name: product.name,
                description: product.description,
                basePrice: product.price,
                category: product.categoryId,
                placement: product.placementId,
                isAvailable: product.isActive,
            });
            
            if (product.imageUrl) {
                setFileList([{
                    uid: '-1',
                    name: 'product-image.jpg',
                    status: 'done',
                    url: product.imageUrl,
                }]);
            }
            
            if (product.modelUrl) {
                setModelPreviewUrl(product.modelUrl);
                setModelUrl(product.modelUrl);
            }
            
            if (product.categoryId) {
                setSelectedCategory(product.categoryId);
                // Fetch category-specific attributes when product loads
                fetchAttributesByCategoryId(product.categoryId);
            }
        }
    }, [product, productForm]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await ProductApiRequest.getProductById(id);
            setProduct(response.data);
        } catch (error) {
            message.error('Failed to fetch product');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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

    const fetchAttributesByCategoryId = async (categoryId) => {
        try {
            const response = await AttributeApiRequest.getWithAttributeValuesByCategoryId(categoryId);
            setAttributes(response.data.$values || []);
        } catch (error) {
            message.error('Failed to fetch attributes for this category');
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await productForm.validateFields();
            
            let imageUrl = product?.imageUrl || '';
            if (fileList.length > 0 && fileList[0].originFileObj) {
                const formData = new FormData();
                formData.append('file', fileList[0].originFileObj);
                
                if (product?.imageUrl) {
                    // Update existing image
                    const uploadResponse = await UploadApiRequest.updateImage(formData, product.imageUrl);
                    imageUrl = uploadResponse.data;
                } else {
                    // Upload new image
                    const uploadResponse = await UploadApiRequest.uploadImage(formData);
                    imageUrl = uploadResponse.data;
                }
            } else if (fileList.length > 0 && fileList[0].url) {
                // Keep the current image URL if no new file is uploaded
                imageUrl = product?.imageUrl;
            }

            // Prepare attribute values
            const attributeValues = [];
            if (selectedCategory) {
                attributes.forEach(attr => {
                    const value = values[attr.name];
                    if (value) {
                        attributeValues.push({
                            value,
                            attributeId: attr.id
                        });
                    }
                });
            }

            const productData = {
                id: id,
                imageUrl,
                modelUrl: modelUrl, // Include the model URL
                name: values.name,
                price: values.basePrice,
                description: values.description,
                isActive: values.isAvailable,
                categoryId: values.category,
                placementId: values.placement,
                status: values.isAvailable ? 'Active' : 'Inactive',
            };

            await ProductApiRequest.updateProduct(productData);
            message.success('Product updated successfully');
            navigate('/admin/products');
        } catch (error) {
            message.error('Failed to update product');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        fetchAttributesByCategoryId(value);
    };

    const handleFileChange = ({ fileList }) => {
        setFileList(fileList);
    };

    const handleCancel = () => {
        navigate('/admin/products');
    };

    const handleColorChange = (color) => {
        setModelColor(color);
    };

    const handleMaterialChange = (property, value) => {
        setModelMaterial(prev => ({
            ...prev,
            [property]: value
        }));
    };

    // Generate 3D model from image
    const handleGenerate3DModel = async () => {
        // Get the current image URL from the product or fileList
        const currentImageUrl = fileList.length > 0 && fileList[0].url 
            ? fileList[0].url 
            : product?.imageUrl;
            
        if (!currentImageUrl) {
            message.error('Please upload an image first');
            return;
        }

        try {
            setGenerating3DModel(true);
            message.loading('Generating 3D model from image. This may take a minute...', 0);

            // Call the shape generation API with the image URL
            const response = await shapeGenerateApiRequest.generateShape({
                caption: 'shape',
                image_path: currentImageUrl,
            });

            if (response.data && response.data.storage_file_path) {
                // Get the shape URL from the response
                const shapeUrl = response.data.storage_file_path;
                setModelUrl(shapeUrl);
                setModelPreviewUrl(shapeUrl);
                message.success('3D model generated successfully');
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
        <>
            <Breadcrumb>
                <Breadcrumb.Item>
                    <Link to="/admin/products">Products</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link to={`/admin/products/edit/${id}`}>Edit Product</Link>
                </Breadcrumb.Item>
            </Breadcrumb>
            
            {/* Product Form */}
            <Form
                form={productForm}
                layout="vertical"
                name="edit_product_form"
                onFinish={handleSubmit}
            >
                <Flex justify='space-between' align='center'>
                    <Typography>Edit Product</Typography>
                    <Flex gap={16}>
                        <Button onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Save Changes
                        </Button>
                    </Flex>
                </Flex>
                <Row gutter={[8, 8]} style={{ marginTop: '10px' }}>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                        <Card title="Product Information" style={{ height: '100%' }}>
                            <Form.Item
                                name="image"
                                label="Product Image"
                                // rules={[{ required: true, message: 'Please upload product image!' }]}
                            >
                                <Upload
                                    listType="picture-card"
                                    maxCount={1}
                                    fileList={fileList}
                                    beforeUpload={() => false}
                                    onChange={handleFileChange}
                                >
                                    <Button variant="text" icon={<UploadOutlined />}></Button>
                                </Upload>
                            </Form.Item>

                            {fileList.length > 0 && (
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
                                                    <ModelPreview 
                                                        modelPath={modelPreviewUrl} 
                                                        color={modelColor} 
                                                        material={modelMaterial} 
                                                    />
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
                                name="basePrice"
                                label="Base Price"
                                rules={[{ required: true, message: 'Please input base price!' }]}
                            >
                                <InputNumber
                                    prefix="$"
                                    min={0}
                                    step={0.01}
                                    style={{ width: '100%' }}
                                    placeholder="Enter base price"
                                />
                            </Form.Item>
                            <Form.Item
                                layout='horizontal'
                                name="isAvailable"
                                label="Available"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                        </Card>
                    </Col>

                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                        <Card title="Product Specification" style={{ height: '100%' }}>
                            <Form.Item
                                name="category"
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
                                name="placement"
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
                                name="description"
                                label="Description"
                                rules={[{ required: true, message: 'Please input product description!' }]}
                            >
                                <Input.TextArea rows={4} placeholder="Enter product description" />
                            </Form.Item>
                            
                        </Card>
                    </Col>
                </Row>
            </Form>

            {/* Product Variants */}
            <ProductVariants productId={id} attributes={attributes} style={{ marginTop: '10px' }} />
        </>
    );
};

export default EditProduct;
