const button = document.createElement("button");
button.id = "custom-action-button";
button.style.position = "fixed";
button.style.bottom = "20px";
button.style.right = "20px";
button.style.zIndex = "10000";
button.style.padding = "10px 20px";
button.style.backgroundColor = "#007BFF";
button.style.color = "#FFF";
button.style.border = "none";
button.style.borderRadius = "5px";
button.style.cursor = "pointer";
button.textContent = "跨境兔图片采集";
button.onclick = extractImages;
document.body.appendChild(button);


async function extractImages() {
    button.textContent = "采集中...";

    const seen = new Set();

    const currentPageUrl = window.location.href;

    // 递归获取所有 img 标签，包括 shadow-root 内部
    function getAllImages(root) {
        let images = [];
        // 查找普通 DOM 中的 img
        images.push(...Array.from(root.querySelectorAll("img, img[data-src], img[data-srcset]"))
            .map(img => (
                {
                    src: img.getAttribute("data-src") || img.getAttribute("data-srcset") || img.getAttribute("big") || img.src,
                    classes: Array.from(img.classList),
                    style: img.getAttribute("style") || "",
                    parentId: img.parentElement?.id || "",
                    parentParentId: img.parentElement?.parentElement?.id || "",
                    parentParentClass: Array.from(img.parentElement?.parentElement?.classList),

                }))
            .filter(image => {
                if (currentPageUrl.includes("1688")) {
                    if (/\.jpg_b\.jpg$/.test(image.src)) {
                        // 将 '.jpg_b.jpg' 替换为 '_.webp'
                        image.src = image.src.replace(/\.jpg_b\.jpg$/, '.jpg_.webp');
                    }
                }
                if (!image.src || seen.has(image.src) || image.src.startsWith("data:image")) return false;
                seen.add(image.src);
                return true;
            })
        );

        // 递归处理 shadow DOM
        function traverseNodes(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // 如果节点有 shadowRoot，则进入 shadowRoot
                if (node.shadowRoot) {
                    images.push(...getAllImages(node.shadowRoot));
                }
                // 继续遍历子节点
                node.childNodes.forEach(traverseNodes);
            }
        }

        root.childNodes.forEach(traverseNodes);
        return images;
    }

    // 处理整个 document，包括所有 shadow-root
    const images = getAllImages(document);
    if (images.length > 0) {
        console.log(images);
        chrome.runtime.sendMessage({
            action: "showImages",
            images: images,
            url: currentPageUrl
        });
    } else {
        alert("未找到任何图片！");
    }

    button.textContent = "跨境兔图片采集";
}

