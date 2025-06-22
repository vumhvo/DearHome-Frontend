import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, Upload, App, Tag, Tooltip, Image, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { VariantApiRequest, AttributeApiRequest, UploadApiRequest } from '../../../api/ApiRequests';
import { shapeGenerateApiRequest } from '../../../api/ApiRequests';
import ModelPreview from '../../../components/ModelPreview';
import ErrorBoundary from '../../../components/ErrorBoundary';

const { Option } = Select;

const ProductVariants = ({ productId, attributes }) => {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [modelUrl, setModelUrl] = useState('');
    const [modelPreviewUrl, setModelPreviewUrl] = useState('');
    const [generating3DModel, setGenerating3DModel] = useState(false);
    const [selectedImageForModel, setSelectedImageForModel] = useState(null);
    const { message } = App.useApp();

    useEffect(() => {
        if (productId) {
            fetchVariants();
        }
    }, [productId]);

    const fetchVariants = async () => {
        try {
            setLoading(true);
            const response = await VariantApiRequest.getVariantsByProductId(productId);
            const variantsData = response.data.$values || [];
            setVariants(variantsData);
            console.log(response.data)
        } catch (error) {
            message.error('Failed to fetch variants');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVariant = () => {
        setEditingVariant(null);
        setFileList([]);
        setModelUrl('');
        setModelPreviewUrl('');
        form.resetFields();
        
        // Set default values for attributes
        const initialValues = {};
        if (attributes && attributes.length > 0) {
            attributes.forEach(attr => {
                if (attr.attributeValues && attr.attributeValues.$values && attr.attributeValues.$values.length > 0) {
                    // Set the first attribute value as default for each attribute
                    initialValues[`attribute_${attr.id}`] = attr.attributeValues.$values[0].id;
                }
            });
        }
        
        if (Object.keys(initialValues).length > 0) {
            form.setFieldsValue(initialValues);
        }
        
        setModalVisible(true);
    };

    const handleEditVariant = (variant) => {
        setEditingVariant(variant);
        setModelUrl(variant.modelUrl || '');
        setModelPreviewUrl(variant.modelUrl || '');
        setSelectedImageForModel(0); // Select first image by default when editing
        // Prepare form values with variant attributes
        const formValues = {
            sku: variant.sku,
            priceAdjustment: variant.priceAdjustment,
            ...formatAttributesForForm(variant.variantAttributes?.$values || [])
        };
        
        form.setFieldsValue(formValues);
        
        // Set file list for images
        if (variant.imageUrls && variant.imageUrls.$values && variant.imageUrls.$values.length > 0) {
            setFileList(variant.imageUrls.$values.map((url, index) => ({
                uid: `-${index}`,
                name: `variant-image-${index}.jpg`,
                status: 'done',
                url: url,
                isExisting: true, // Mark as existing image
            })));
        } else {
            setFileList([]);
        }
        
        setModalVisible(true);
    };

    const formatAttributesForForm = (variantAttributes) => {
        const formattedAttributes = {};
        variantAttributes.forEach(attr => {
            formattedAttributes[`attribute_${attr.attributeId}`] = attr.attributeValueId;
        });
        return formattedAttributes;
    };

    const handleDeleteVariant = async (variantId) => {
        try {
            await VariantApiRequest.deleteVariant(variantId);
            message.success('Variant deleted successfully');
            fetchVariants();
        } catch (error) {
            message.error('Failed to delete variant');
            console.error(error);
        }
    };

    const handleGenerate3DModel = async () => {
        if (!fileList.length || selectedImageForModel === null) {
            message.error('Please upload and select an image first');
            return;
        }

        const selectedFile = fileList[selectedImageForModel];
        const imageUrl = selectedFile.url || (selectedFile.originFileObj && URL.createObjectURL(selectedFile.originFileObj));
        if (!imageUrl) {
            message.error('Invalid image file');
            return;
        }

        try {
            setGenerating3DModel(true);
            message.loading('Generating 3D model from image. This may take a minute...', 0);
            const response = await shapeGenerateApiRequest.generateShape({
                caption: 'shape',
                image_path: fileList[0].url,
            });
            if (response.data && response.data.storage_file_path) {
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
            message.destroy();
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            // Handle images - preserve existing ones and upload new ones
            let imageUrls = [];
            for (const file of fileList) {
                if (file.originFileObj) {
                    // This is a new image, upload it
                    const formData = new FormData();
                    formData.append('file', file.originFileObj);
                    const uploadResponse = await UploadApiRequest.uploadImage(formData);
                    imageUrls.push(uploadResponse.data);
                } else if (file.url && (file.isExisting || !file.originFileObj)) {
                    // This is an existing image or one that was already uploaded
                    imageUrls.push(file.url);
                }
            }
            
            // If editing and no new images uploaded, keep the original images
            if (editingVariant && imageUrls.length === 0 && editingVariant.imageUrls && editingVariant.imageUrls.$values) {
                imageUrls = editingVariant.imageUrls.$values;
            }
            
            // Prepare variant attributes
            const variantAttributes = [];
            Object.entries(values).forEach(([key, value]) => {
                if (key.startsWith('attribute_') && value) {
                    const attributeId = key.replace('attribute_', '');
                    variantAttributes.push({
                        attributeValueId: value,
                        attributeId: attributeId
                    });
                }
            });
            
            const variantData = {
                imageUrls,
                priceAdjustment: values.priceAdjustment || 0,
                isActive: true,
                sku: values.sku || `SKU-${Date.now()}`,
                productId,
                variantAttributes,
                modelUrl: modelUrl || '',
            };
            
            if (editingVariant) {
                // Update existing variant
                variantData.id = editingVariant.id;
                await VariantApiRequest.updateVariant(variantData);
                message.success('Variant updated successfully');
            } else {
                // Create new variant
                await VariantApiRequest.createVariant(variantData);
                message.success('Variant added successfully');
            }
            
            setModalVisible(false);
            fetchVariants();
        } catch (error) {
            message.error('Failed to save variant');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = ({ fileList }) => {
        setFileList(fileList);
        // Clear model preview and selected image if all images are removed
        if (fileList.length === 0) {
            setModelUrl('');
            setModelPreviewUrl('');
            setSelectedImageForModel(null);
        } else if (!selectedImageForModel && fileList.length > 0) {
            // Select first image by default if none selected
            setSelectedImageForModel(0);
        }
    };

    const columns = [
        {
            title: 'Image',
            dataIndex: 'imageUrls',
            key: 'image',
            render: (imageUrls) => (
                imageUrls && imageUrls.$values.length > 0 ? (
                    <Image src={imageUrls.$values[0]} alt="Variant" style={{ width: 50, height: 50, objectFit: 'cover' }} />
                ) : null
            ),
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
        },
        {
            title: 'Price Adjustment',
            dataIndex: 'priceAdjustment',
            key: 'priceAdjustment',
            render: (price) => `$${price?.toFixed(2)}`,
        },
        {
            title: 'Attributes',
            dataIndex: 'variantAttributes',
            key: 'attributes',
            render: (variantAttributes) => (
                <Space size={[0, 8]} wrap>
                    {variantAttributes && variantAttributes.$values && variantAttributes.$values.map((attr) => (
                        <Tag color="blue" key={attr.id}>
                            {attr.attributeValue ? `${attr.attributeValue.value}` : 
                             attr.attribute ? `${attr.attribute.name}: ${attr.value}` : 
                             `Attribute: ${attr.value || 'Unknown'}`}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit">
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={() => handleEditVariant(record)} 
                            type="text"
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDeleteVariant(record.id)} 
                            type="text" 
                            danger
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Card 
            title="Product Variants" 
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddVariant}>Add Variant</Button>}
        >
            <Table 
                columns={columns} 
                dataSource={variants} 
                rowKey="id" 
                loading={loading}
                pagination={false}
            />
            
            <Modal
                title={editingVariant ? "Edit Variant" : "Add Variant"}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                confirmLoading={loading}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item>
                        <div style={{ color: 'gray', marginBottom: 16 }}>
                            <b>Note:</b> 3D models are managed per variant. Upload or generate a 3D model for this variant below.
                        </div>
                    </Form.Item>
                    
                    <Form.Item label="Images">
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={handleFileChange}
                            beforeUpload={() => false}
                        >
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        </Upload>
                        {!fileList.length && (
                            <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                                Please upload an image first to enable 3D model generation
                            </div>
                        )}
                    </Form.Item>
                    
                    {fileList.length > 0 && (
                        <Form.Item label="Select Image for 3D Model">
                            <Radio.Group 
                                value={selectedImageForModel}
                                onChange={(e) => setSelectedImageForModel(e.target.value)}
                                style={{ display: 'flex', gap: '16px' }}
                            >
                                {fileList.map((file, index) => (
                                    <Radio key={index} value={index} style={{ display: 'flex', alignItems: 'center' }}>
                                        <Image 
                                            src={file.url || URL.createObjectURL(file.originFileObj)} 
                                            alt={`Image ${index + 1}`}
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', marginLeft: '8px' }}
                                            preview={false}
                                        />
                                    </Radio>
                                ))}
                            </Radio.Group>
                        </Form.Item>
                    )}
                    
                    <Form.Item label="3D Model">
                        {modelPreviewUrl ? (
                            <div>
                                <div style={{ marginBottom: 16 }}>
                                    <Button 
                                        type="primary" 
                                        onClick={handleGenerate3DModel}
                                        loading={generating3DModel}
                                        disabled={!fileList.length || selectedImageForModel === null}
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
                                    disabled={!fileList.length || selectedImageForModel === null}
                                >
                                    Generate 3D Model from Selected Image
                                </Button>
                                <p style={{ marginTop: 8, color: fileList.length ? 'gray' : '#ff4d4f', fontStyle: 'italic' }}>
                                    {!fileList.length ? 
                                        'Please upload at least one image before generating a 3D model' :
                                        selectedImageForModel === null ?
                                        'Please select an image to generate the 3D model' :
                                        'Our AI will automatically generate a 3D model based on your selected image'}
                                </p>
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item
                        name="sku"
                        label="SKU"
                        rules={[{ required: true, message: 'Please input the SKU!' }]}
                    >
                        <Input placeholder="Enter SKU" />
                    </Form.Item>
                    
                    <Form.Item
                        name="priceAdjustment"
                        label="Price Adjustment"
                        rules={[{ required: true, message: 'Please input the price adjustment!' }]}
                    >
                        <InputNumber
                            prefix="$"
                            min={0}
                            step={0.01}
                            style={{ width: '100%' }}
                            placeholder="Enter price adjustment"
                        />
                    </Form.Item>
                    
                    {attributes.map(attr => {
                        const attributeValues = attr.attributeValues?.$values || [];
                        // Get the first attribute value as default if available
                        const defaultValue = editingVariant?.variantAttributes?.$values[0].attributeValue.id;
                    
                        return (
                            <Form.Item
                                key={attr.id}
                                name={`attribute_${attr.id}`}
                                label={attr.name}
                                rules={[{ required: true, message: `Please select a ${attr.name}!` }]}
                                initialValue={defaultValue}
                            >
                                <Select 
                                placeholder={`Select ${attr.name}`}>
                                    {attributeValues.map(value => {
                                        // Special handling for color type attributes
                                        if (attr.type === 'Color') {
                                            
                                            return (
                                                <Option key={value.id} value={value.id}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <div 
                                                            style={{ 
                                                                backgroundColor: value.value, 
                                                                width: '20px', 
                                                                height: '20px', 
                                                                marginRight: '8px',
                                                                border: '1px solid #d9d9d9',
                                                                borderRadius: '2px'
                                                            }} 
                                                        />
                                                        {typeof value.value === 'string' ? value.value : ''}
                                                    </div>
                                                </Option>
                                            );
                                        }
                                        
                                        return (
                                            <Option key={value.id} value={value.id}>
                                                {typeof value.value === 'string' ? value.value : ''}
                                            </Option>
                                        );
                                    })}
                                </Select>
                            </Form.Item>
                        );
                    })}
                </Form>
            </Modal>
        </Card>
    );
};

export default ProductVariants;
