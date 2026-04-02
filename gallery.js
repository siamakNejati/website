(() => {
  const grid = document.querySelector("[data-gallery-grid]");
  const status = document.querySelector("[data-gallery-status]");

  if (!grid) {
    return;
  }

  const DIRECTORY_URL = "./gallery/";
  const MANIFEST_URL = "./gallery-images.json";
  const SCRIPT_MANIFEST_IMAGES = Array.isArray(window.__GALLERY_IMAGES__) ? window.__GALLERY_IMAGES__ : [];
  const POLL_INTERVAL = 12000;
  const IMAGE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;
  const NAME_COLLATOR = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base"
  });
  let lastSignature = "";
  const lightbox = document.createElement("div");
  const lightboxDialog = document.createElement("div");
  const lightboxClose = document.createElement("button");
  const lightboxImage = document.createElement("img");
  const lightboxTitle = document.createElement("p");

  const toText = (value) => (typeof value === "string" ? value.trim() : "");
  const toImageSrc = (fileName) => DIRECTORY_URL + encodeURIComponent(fileName);
  const toFileName = (value) => decodeURIComponent(
    toText(value)
      .split("/")
      .pop()
      ?.split("?")[0]
      ?.split("#")[0] || ""
  );
  const toImageTitle = (value) => toText(value).replace(/\.[^.]+$/, "").trim() || "Untitled image";

  const compareImages = (left, right) => NAME_COLLATOR.compare(left.fileName, right.fileName);

  const normalizeImages = (images) => (Array.isArray(images) ? images : [images])
    .filter((image) => IMAGE_PATTERN.test(toText(image?.src) || toText(image?.fileName)))
    .map((image) => {
      const src = toText(image.src) || toImageSrc(toText(image.fileName));
      const fileName = toText(image.fileName) || toFileName(src);
      const rawName = toText(image.name) || fileName;

      return {
        fileName,
        rawName,
        src
      };
    })
    .sort(compareImages)
    .map((image) => ({
      fileName: image.fileName,
      name: toImageTitle(image.fileName),
      src: image.src
    }));

  const mergeImages = (manifestImages, directoryImages) => {
    const merged = new Map();

    manifestImages.forEach((image) => {
      merged.set(image.src, image);
    });

    directoryImages.forEach((image) => {
      if (!merged.has(image.src)) {
        merged.set(image.src, image);
      }
    });

    return Array.from(merged.values()).sort(compareImages);
  };

  const loadScriptManifestImages = () => normalizeImages(SCRIPT_MANIFEST_IMAGES);

  lightbox.className = "gallery-lightbox";
  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");

  lightboxDialog.className = "gallery-lightbox-dialog";
  lightboxDialog.setAttribute("role", "dialog");
  lightboxDialog.setAttribute("aria-modal", "true");
  lightboxDialog.setAttribute("aria-label", "Expanded gallery image");

  lightboxClose.className = "gallery-lightbox-close";
  lightboxClose.type = "button";
  lightboxClose.setAttribute("aria-label", "Close image viewer");
  lightboxClose.textContent = "Close";

  lightboxImage.className = "gallery-lightbox-image";
  lightboxImage.alt = "";

  lightboxTitle.className = "gallery-lightbox-title";

  lightboxDialog.append(lightboxClose, lightboxImage, lightboxTitle);
  lightbox.appendChild(lightboxDialog);
  document.body.appendChild(lightbox);

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.removeAttribute("src");
    document.body.classList.remove("gallery-lightbox-open");
  };

  const openLightbox = (image) => {
    lightboxImage.src = image.src;
    lightboxImage.alt = image.name;
    lightboxTitle.textContent = image.name;
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("gallery-lightbox-open");
  };

  lightboxClose.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
      closeLightbox();
    }
  });

  const createEmptyState = () => {
    const card = document.createElement("article");
    const body = document.createElement("div");
    const label = document.createElement("p");
    const title = document.createElement("h2");
    const text = document.createElement("p");

    card.className = "content-card gallery-card gallery-card--empty";
    body.className = "content-card-body";
    label.className = "content-card-label";
    title.className = "content-card-title";
    text.className = "content-card-text";

    label.textContent = "Gallery";
    title.textContent = "Add images to the gallery folder";
    text.textContent = "Drop JPG, PNG, WebP, GIF, or AVIF files into ./gallery and they will appear here.";

    body.append(label, title, text);
    card.appendChild(body);

    return card;
  };

  const createImageCard = (image, index) => {
    const card = document.createElement("article");
    const media = document.createElement("button");
    const picture = document.createElement("img");
    const body = document.createElement("div");
    const title = document.createElement("h2");

    card.className = "content-card gallery-card";
    media.className = "content-card-media gallery-card-trigger";
    media.type = "button";
    body.className = "content-card-body";
    title.className = "content-card-title";

    picture.src = image.src;
    picture.alt = image.name;
    picture.loading = index < 4 ? "eager" : "lazy";
    picture.decoding = "async";

    picture.addEventListener("load", () => {
      card.dataset.orientation = picture.naturalWidth >= picture.naturalHeight ? "landscape" : "portrait";
    }, { once: true });

    title.textContent = image.name;
    media.setAttribute("aria-label", "Open " + image.name);
    media.addEventListener("click", () => {
      openLightbox(image);
    });

    media.appendChild(picture);
    body.appendChild(title);
    card.append(media, body);

    return card;
  };

  const renderImages = (images) => {
    const signature = images.map((image) => [image.fileName, image.name, image.src].join("~")).join("|");

    if (signature === lastSignature) {
      return;
    }

    lastSignature = signature;

    if (!images.length) {
      grid.replaceChildren(createEmptyState());

      if (status) {
        status.textContent = "No gallery images found.";
      }

      return;
    }

    const fragment = document.createDocumentFragment();

    images.forEach((image, index) => {
      fragment.appendChild(createImageCard(image, index));
    });

    grid.replaceChildren(fragment);

    if (status) {
      status.textContent = "Loaded " + images.length + " gallery image" + (images.length === 1 ? "" : "s") + ".";
    }
  };

  const parseDirectoryListing = (markup) => {
    const directoryDocument = new DOMParser().parseFromString(markup, "text/html");

    return Array.from(directoryDocument.querySelectorAll("a[href]"))
      .map((link) => link.getAttribute("href") || "")
      .filter((href) => IMAGE_PATTERN.test(href))
      .map((href) => ({
        fileName: toFileName(href),
        src: toImageSrc(toFileName(href))
      }));
  };

  const loadDirectoryImages = async () => {
    const response = await fetch(DIRECTORY_URL, { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    const contentType = response.headers.get("content-type") || "";

    if (!/text\/html|text\/plain/i.test(contentType)) {
      return [];
    }

    return normalizeImages(parseDirectoryListing(await response.text()));
  };

  const loadManifestImages = async () => {
    const response = await fetch(MANIFEST_URL + "?ts=" + Date.now(), { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    return normalizeImages(await response.json());
  };

  const refreshGallery = async () => {
    const scriptManifestImages = loadScriptManifestImages();
    const [manifestResult, directoryResult] = await Promise.allSettled([
      loadManifestImages(),
      loadDirectoryImages()
    ]);

    const manifestImages = manifestResult.status === "fulfilled" ? manifestResult.value : [];
    const directoryImages = directoryResult.status === "fulfilled" ? directoryResult.value : [];
    const images = normalizeImages(
      mergeImages(
        scriptManifestImages,
        mergeImages(manifestImages, directoryImages)
      )
    );

    if (images.length) {
      renderImages(images);
      return;
    }

    renderImages([]);
  };

  renderImages(loadScriptManifestImages());

  refreshGallery().catch(() => {
    if (!lastSignature) {
      renderImages([]);
    }
  });

  window.setInterval(() => {
    refreshGallery().catch(() => {
      if (!lastSignature) {
        renderImages([]);
      }
    });
  }, POLL_INTERVAL);
})();
