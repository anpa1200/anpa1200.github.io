(function () {
  var MAX_IMAGE_BYTES = 3 * 1024 * 1024;
  var MAX_LENGTHS = {
    title: 120,
    contact: 120,
    url: 300,
    details: 5000
  };

  var dangerousPatterns = [
    { label: "HTML script tag", pattern: /<\s*\/?\s*script\b/i },
    { label: "HTML iframe/object/embed tag", pattern: /<\s*(iframe|object|embed|meta|link|base|form|input|button)\b/i },
    { label: "JavaScript URL", pattern: /javascript\s*:/i },
    { label: "data HTML URL", pattern: /data\s*:\s*text\/html/i },
    { label: "inline event handler", pattern: /\bon[a-z]{3,}\s*=/i },
    { label: "SQL injection marker", pattern: /('|%27|")\s*(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i },
    { label: "SQL stacked query", pattern: /;\s*(drop|alter|truncate|insert|update|delete|exec|union)\b/i },
    { label: "SQL comment operator", pattern: /(--|#|\/\*)\s*(select|union|drop|insert|update|delete|or|and)?/i },
    { label: "shell command chaining", pattern: /(\|\||&&|;\s*)\s*(curl|wget|bash|sh|powershell|cmd|nc|python|perl)\b/i },
    { label: "template injection", pattern: /(\{\{.*\}\}|\$\{.*\}|<%.*%>)/i },
    { label: "path traversal", pattern: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i }
  ];

  var form = document.getElementById("adversarygraph-feedback-form");
  if (!form) {
    return;
  }

  var fields = {
    type: document.getElementById("feedback-type"),
    area: document.getElementById("feedback-area"),
    title: document.getElementById("feedback-title"),
    contact: document.getElementById("feedback-contact"),
    url: document.getElementById("feedback-url"),
    details: document.getElementById("feedback-details"),
    image: document.getElementById("feedback-image")
  };
  var uploadZone = document.getElementById("feedback-upload-zone");
  var preview = document.getElementById("feedback-image-preview");
  var previewImg = document.getElementById("feedback-preview-img");
  var imageName = document.getElementById("feedback-image-name");
  var imageMeta = document.getElementById("feedback-image-meta");
  var status = document.getElementById("feedback-status");
  var output = document.getElementById("feedback-output");
  var copyButton = document.getElementById("feedback-copy");
  var githubButton = document.getElementById("feedback-github");
  var emailButton = document.getElementById("feedback-email");
  var resetButton = document.getElementById("feedback-reset");
  var currentImage = null;
  var currentObjectUrl = null;

  function setStatus(message, mode) {
    status.textContent = message || "";
    status.classList.toggle("is-error", mode === "error");
    status.classList.toggle("is-ok", mode === "ok");
  }

  function normalizeText(value, maxLength) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .trim()
      .slice(0, maxLength);
  }

  function hasDangerousPattern(value) {
    var text = String(value || "");
    for (var i = 0; i < dangerousPatterns.length; i += 1) {
      if (dangerousPatterns[i].pattern.test(text)) {
        return dangerousPatterns[i].label;
      }
    }
    return "";
  }

  function getSafeUrl(value) {
    var raw = normalizeText(value, MAX_LENGTHS.url);
    if (!raw) {
      return "";
    }
    try {
      var parsed = new URL(raw, window.location.origin);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Only HTTP and HTTPS URLs are allowed.");
      }
      return parsed.href;
    } catch (error) {
      throw new Error("Relevant page must be a valid HTTP or HTTPS URL.");
    }
  }

  function bytesStartWith(bytes, signature) {
    if (bytes.length < signature.length) {
      return false;
    }
    for (var i = 0; i < signature.length; i += 1) {
      if (bytes[i] !== signature[i]) {
        return false;
      }
    }
    return true;
  }

  function ascii(bytes, start, end) {
    var value = "";
    for (var i = start; i < end && i < bytes.length; i += 1) {
      value += String.fromCharCode(bytes[i]);
    }
    return value;
  }

  function detectImageType(bytes) {
    if (bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
      return "image/png";
    }
    if (bytesStartWith(bytes, [0xff, 0xd8, 0xff])) {
      return "image/jpeg";
    }
    if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") {
      return "image/gif";
    }
    if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
      return "image/webp";
    }
    return "";
  }

  function resetImage() {
    currentImage = null;
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
    preview.classList.remove("is-visible");
    previewImg.removeAttribute("src");
    imageName.textContent = "No image selected";
    imageMeta.textContent = "Image metadata will appear after validation.";
    fields.image.value = "";
  }

  function validateImage(file) {
    if (!file) {
      return Promise.resolve();
    }
    if (file.size > MAX_IMAGE_BYTES) {
      resetImage();
      return Promise.reject(new Error("Screenshot is too large. Maximum size is 3 MB."));
    }
    return file.slice(0, 16).arrayBuffer().then(function (buffer) {
      var bytes = new Uint8Array(buffer);
      var detectedType = detectImageType(bytes);
      var allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
      if (allowedTypes.indexOf(detectedType) === -1) {
        resetImage();
        throw new Error("Blocked file: magic bytes do not match PNG, JPEG, GIF, or WebP.");
      }
      if (file.type && file.type !== detectedType) {
        resetImage();
        throw new Error("Blocked file: browser MIME type does not match image magic bytes.");
      }
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
      currentObjectUrl = URL.createObjectURL(file);
      currentImage = {
        name: normalizeText(file.name, 180),
        type: detectedType,
        size: file.size
      };
      previewImg.src = currentObjectUrl;
      imageName.textContent = currentImage.name;
      imageMeta.textContent = detectedType + " / " + Math.round(file.size / 1024) + " KB / validated by magic bytes";
      preview.classList.add("is-visible");
      setStatus("Screenshot validated locally. Attach it manually to the GitHub issue or email draft.", "ok");
    });
  }

  function collectReport() {
    var title = normalizeText(fields.title.value, MAX_LENGTHS.title);
    var contact = normalizeText(fields.contact.value, MAX_LENGTHS.contact);
    var details = normalizeText(fields.details.value, MAX_LENGTHS.details);
    var url = getSafeUrl(fields.url.value);
    var values = [title, contact, url, details];
    var labels = ["title", "contact", "URL", "details"];

    if (title.length < 8) {
      throw new Error("Title must be at least 8 characters.");
    }
    if (details.length < 30) {
      throw new Error("Details must be at least 30 characters.");
    }
    for (var i = 0; i < values.length; i += 1) {
      var finding = hasDangerousPattern(values[i]);
      if (finding) {
        throw new Error("Blocked " + labels[i] + ": " + finding + " pattern detected.");
      }
    }

    var report = [
      "# AdversaryGraph Feedback",
      "",
      "Type: " + fields.type.value,
      "Area: " + fields.area.value,
      "Title: " + title,
      "Page: " + (url || "not provided"),
      "Contact: " + (contact || "not provided"),
      "",
      "## Details",
      details,
      "",
      "## Screenshot",
      currentImage
        ? "Validated locally: " + currentImage.name + " (" + currentImage.type + ", " + Math.round(currentImage.size / 1024) + " KB). Attach this image manually."
        : "No screenshot attached.",
      "",
      "## Client-side validation",
      "- Plain-text report generated without raw HTML rendering.",
      "- Text fields normalized, length-limited, and screened for XSS/SQLi/shell/template-injection patterns.",
      "- Image files are accepted only after PNG/JPEG/GIF/WebP magic-number validation.",
      "- This static page does not store feedback or screenshots."
    ].join("\n");

    return {
      title: title,
      body: report
    };
  }

  function showReport(report) {
    output.textContent = report.body;
    output.classList.add("is-visible");
  }

  function handleValidationError(error) {
    setStatus(error.message || "Feedback validation failed.", "error");
  }

  fields.image.addEventListener("change", function () {
    validateImage(fields.image.files && fields.image.files[0]).catch(handleValidationError);
  });

  uploadZone.addEventListener("dragover", function (event) {
    event.preventDefault();
    uploadZone.classList.add("is-dragover");
  });

  uploadZone.addEventListener("dragleave", function () {
    uploadZone.classList.remove("is-dragover");
  });

  uploadZone.addEventListener("drop", function (event) {
    event.preventDefault();
    uploadZone.classList.remove("is-dragover");
    var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    validateImage(file).catch(handleValidationError);
  });

  document.addEventListener("paste", function (event) {
    if (!event.clipboardData || !event.clipboardData.files || !event.clipboardData.files.length) {
      return;
    }
    var file = event.clipboardData.files[0];
    validateImage(file).catch(handleValidationError);
  });

  copyButton.addEventListener("click", function () {
    try {
      var report = collectReport();
      showReport(report);
      navigator.clipboard.writeText(report.body).then(function () {
        setStatus("Sanitized report copied to clipboard.", "ok");
      }).catch(function () {
        setStatus("Sanitized report generated below. Clipboard access was blocked by the browser.", "ok");
      });
    } catch (error) {
      handleValidationError(error);
    }
  });

  githubButton.addEventListener("click", function () {
    try {
      var report = collectReport();
      showReport(report);
      var url = "https://github.com/anpa1200/adversarygraph/issues/new?title=" +
        encodeURIComponent("[" + fields.type.value + "] " + report.title) +
        "&body=" + encodeURIComponent(report.body);
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus("GitHub issue draft opened. Attach the validated screenshot manually if needed.", "ok");
    } catch (error) {
      handleValidationError(error);
    }
  });

  emailButton.addEventListener("click", function () {
    try {
      var report = collectReport();
      showReport(report);
      var mailto = "mailto:1200km@gmail.com?subject=" +
        encodeURIComponent("AdversaryGraph " + fields.type.value + ": " + report.title) +
        "&body=" + encodeURIComponent(report.body);
      window.location.href = mailto;
      setStatus("Email draft opened. Attach the validated screenshot manually if needed.", "ok");
    } catch (error) {
      handleValidationError(error);
    }
  });

  resetButton.addEventListener("click", function () {
    resetImage();
    output.textContent = "";
    output.classList.remove("is-visible");
    setStatus("", "");
  });
})();
