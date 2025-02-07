chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
    if (request && request.message && request.message === "hasExtension") {
        chrome.storage.local.get(['images'], (result) => {
            if (result.images) {
                chrome.storage.local.set({'token': request.token}, () => {
                    if (chrome.runtime.lastError) {
                        console.error("存储 token 失败:", chrome.runtime.lastError.message);
                        sendResponse({hasExtension: false, error: chrome.runtime.lastError.message});
                    } else {
                        sendResponse({hasExtension: true, images: result.images});
                    }
                });
            } else {
                console.error("没有找到图片数据！");
                sendResponse({hasExtension: false, error: "No images found"});
            }
        });
        return true;
    }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log(request)
    
    if (request.action === "getCookie") {
        chrome.cookies.get({name: request.name, url: request.url}, (cookie) => {
            sendResponse({value: cookie ? cookie.value : null});
        });
    } else if (request.action === "showImages") {
        const imageFilter = {
            "1688": {
                gallery: {
                    class: ["gallery-img","detail-gallery-img"], // 第一种页面的封面图
                    alt_class: ["od-gallery-img"], // 第二种页面的封面图
                    parentParentId: [], // 备用方案，如果 class 方式获取不到
                    parentId: []
                },
                description: {
                    class: ["desc-img-loaded"], // 第一种页面的详情图
                    alt_class: [], // 备用 class
                    parentParentId: ["detail"], // 第二种页面的详情图，通过 style 识别
                    parentId: []
                }
            },
            "tmall": {
                gallery: {
                    class: ["thumbnailPic--QasTmWDm"], // 第一种页面的封面图
                    alt_class: [], // 第二种页面的封面图
                    parentParentId: [], // 备用方案，如果 class 方式获取不到
                    parentId: []
                },
                description: {
                    class: ["descV8-singleImage-image"], // 第一种页面的详情图
                    alt_class: [], // 备用 class
                    parentParentId: [], // 第二种页面的详情图，通过 style 识别
                    parentId: []
                }
            },
            "taobao": {
                gallery: {
                    class: ["thumbnailPic--QasTmWDm"], // 第一种页面的封面图
                    alt_class: [], // 第二种页面的封面图
                    parentParentId: [], // 备用方案，如果 class 方式获取不到
                    parentId: []
                },
                description: {
                    class: ["descV8-singleImage-image"], // 第一种页面的详情图
                    alt_class: [], // 备用 class
                    parentParentId: [], // 第二种页面的详情图，通过 style 识别
                    parentId: []
                }
            },
            "pinduoduo": {
                gallery: {
                    class: ["goods-img"], // 第一种页面的封面图
                    alt_class: [], // 第二种页面的封面图
                    parentParentId: [] ,// 备用方案，如果 class 方式获取不到
                    parentId: []
                },
                description: {
                    class: ["goodsIntroImg"], // 第一种页面的详情图
                    alt_class: [], // 备用 class
                    parentParentId: [], // 第二种页面的详情图，通过 style 识别
                    parentId: []
                }
            },
            "bao66": {
                gallery: {
                    class: [], // 第一种页面的封面图
                    alt_class: [], // 第二种页面的封面图
                    parentStyle: [], // 备用方案，如果 class 方式获取不到
                    parentParentClass: ["picture_s","picture_booth"],
                    parentId: []
                },
                description: {
                    class: [], // 第一种页面的详情图
                    alt_class: [], // 备用 class
                    parentStyle: [], // 第二种页面的详情图，通过 style 识别
                    parentParentClass: [],
                    parentId: ["productmemo"]
                }
            }
        };
        
        const {images, url} = request;

        const matchedKey = Object.keys(imageFilter).find((key) => url.includes(key));

        if (!matchedKey) {
            console.warn("未找到匹配的过滤规则，跳过筛选。");
            sendResponse({status: "no_filter_rules"});
            return true;
        }
        const allowedClasses = imageFilter[matchedKey];

        // 封面图筛选：优先使用 class，若无则使用 style 结构
        let galleryImages = images.filter((image) => {
            return image.classes.some((cls) => [...allowedClasses.gallery.class, ...allowedClasses.gallery.alt_class].includes(cls))
        });
    
        if (galleryImages.length === 0 ) {
            galleryImages = images.filter((image) =>
                image.parentStyle && allowedClasses.gallery.parentStyle.some(style => image.parentStyle.includes(style))
            );
        }
        if (galleryImages.length === 0) {
             galleryImages = images.filter((image) =>
                image.parentParentClass.some((cls) => [...allowedClasses.gallery.parentParentClass].includes(cls))
            );
        }
        
        // 详情图筛选：优先使用 class，若无则使用 style 结构
        let descriptionImages = images.filter((image, index) => {
            return image.classes.some((cls) => {
                return [...allowedClasses.description.class, ...allowedClasses.description.alt_class].includes(cls)
            } )});

        if (descriptionImages.length === 0) {
            descriptionImages = images.filter((image) => allowedClasses.description.parentId.some(pid => image.parentId.includes(pid)));
        }
        if (descriptionImages.length === 0) {
            descriptionImages = images.filter((image) => allowedClasses.description.parentParentId.some(pid => image.parentParentId.includes(pid)));
        }


        // 分类存储图片
        const filteredImagesObj = {
            gallery_img: galleryImages,
            desc_img: descriptionImages
        };
        console.log(filteredImagesObj)
        chrome.storage.local.set({images: filteredImagesObj}, () => {
            if (chrome.runtime.lastError) {
                console.error("存储图片失败：", chrome.runtime.lastError.message);
                sendResponse({status: "error", message: chrome.runtime.lastError.message});
            } else {
                chrome.tabs.create({url: 'https://www.khtool.cn/getimglist'});
                sendResponse({status: "success", filteredImagesObj});
            }
        });
    }
    return true; // 必须返回 true 以指示异步响应
});
