import { auth } from "/firebase-client.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Get the article ID from the URL (passed from manage.html)
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get("id");

  if (!articleId) {
    alert("No article ID provided.");
    window.location.href = "/pages/admin/manage.html";
    return;
  }

  // 2. Initialize Quill Editor
  const quill = new Quill("#editor-container", {
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    },
  });

  // UI Elements
  const snippetInput = document.getElementById("snippet");
  const snippetCounter = document.getElementById("snippet-counter");
  const titleInput = document.getElementById("title");
  const imageUrlInput = document.getElementById("imageUrl");
  const imageCaptionInput = document.getElementById("imageCaption");
  const imageCreditInput = document.getElementById("imageCredit");
  const form = document.getElementById("edit-news-form");
  const messageDiv = document.getElementById("form-message");

  // Character counter listener
  snippetInput.addEventListener("input", () => {
    snippetCounter.textContent = `${snippetInput.value.length} / 150`;
  });

  // Image toggle logic
  const imageModeRadios = document.getElementsByName("imageMode");
  const uploadContainer = document.getElementById("upload-container");
  const linkContainer = document.getElementById("link-container");
  const imageFile = document.getElementById("imageFile");
  const imageMetaContainer = document.getElementById("image-meta-container"); // NEW

  imageModeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "upload") {
        uploadContainer.classList.remove("hidden");
        linkContainer.classList.add("hidden");
        imageMetaContainer.classList.remove("hidden");
      } else if (e.target.value === "link") {
        uploadContainer.classList.add("hidden");
        linkContainer.classList.remove("hidden");
        imageMetaContainer.classList.remove("hidden");
        imageFile.value = "";
      } else if (e.target.value === "none") {
        uploadContainer.classList.add("hidden");
        linkContainer.classList.add("hidden");
        imageMetaContainer.classList.add("hidden");
        imageFile.value = "";
        imageUrlInput.value = "";
        imageCaptionInput.value = "";
        imageCreditInput.value = "";
      }
    });
  });

  // 3. Fetch existing data and pre-fill the form
  try {
    const response = await fetch(`http://localhost:3000/api/news/${articleId}`);
    if (!response.ok) throw new Error("Failed to fetch article details");

    const article = await response.json();

    // redirect unauthorized authors attempting to edit other pages
    const currentUserId = sessionStorage.getItem("currentUserId");
    const userRole = sessionStorage.getItem("userRole");
    if (userRole !== "admin" && article.authorId !== currentUserId) {
      alert("You only have permission to edit your own articles.");
      window.location.href = "/pages/admin/manage.html";
      return;
    }

    // Populate text inputs
    titleInput.value = article.title;
    snippetInput.value = article.snippet;
    snippetCounter.textContent = `${article.snippet.length} / 150`;
    imageCaptionInput.value = article.imageCaption || "";
    imageCreditInput.value = article.imageCredit || "";

    // Populate the image (defaults to keeping the existing Cloudinary link)
    if (article.imageUrl) {
      imageUrlInput.value = article.imageUrl;
    } else {
      // If the article has no image, toggle the UI to "No Image" mode
      document.querySelector('input[name="imageMode"][value="none"]').click();
    }

    // Populate Quill editor safely
    if (article.content) {
      quill.root.innerHTML = article.content;
    }

    // Pre-select the current publication status ("published" or "draft")
    const articleStatus = article.status || "published";
    const statusRadio = document.querySelector(
      `input[name="articleStatus"][value="${articleStatus}"]`,
    );
    if (statusRadio) statusRadio.checked = true;
  } catch (error) {
    console.error("Error loading article:", error);
    alert("Failed to load article data.");
  }

  // 4. Handle the form submission (PUT Request)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const richTextContent = quill.root.innerHTML;
    if (richTextContent === "<p><br></p>") {
      alert("Please write some content before publishing.");
      return;
    }

    const formData = new FormData();
    formData.append("title", titleInput.value);
    formData.append("snippet", snippetInput.value);
    formData.append("content", richTextContent);
    formData.append("imageCaption", imageCaptionInput.value);
    formData.append("imageCredit", imageCreditInput.value);
    formData.append("lastEditedBy", sessionStorage.getItem("userName"));

    // Append the updated status
    const selectedStatus = document.querySelector(
      'input[name="articleStatus"]:checked',
    ).value;
    formData.append("status", selectedStatus);
    const selectedMode = document.querySelector(
      'input[name="imageMode"]:checked',
    ).value;

    if (selectedMode === "upload" && imageFile.files.length > 0) {
      const file = imageFile.files[0];
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit

      if (file.size > maxSizeBytes) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        messageDiv.textContent = `Error: Image is too large (${fileSizeMB}MB). Maximum allowed size is 5MB.`;
        messageDiv.className =
          "mt-4 p-4 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
        return;
      }

      formData.append("imageFile", file);
    } else if (selectedMode === "link" && imageUrlInput.value) {
      formData.append("imageUrl", imageUrlInput.value);
    } else if (selectedMode === "none") {
      formData.append("imageUrl", ""); // Explicitly wipe the old image!
    } else {
      alert("Please provide an image file, a web link, or select 'No Image'.");
      return;
    }

    messageDiv.textContent = "Saving changes... please wait.";
    messageDiv.className =
      "mt-4 p-4 rounded-lg text-sm font-bold bg-[#f5ede0] text-[#12284b] block";

    if (!auth.currentUser) {
      alert("Authentication error: Please refresh the page.");
      return;
    }
    const token = await auth.currentUser.getIdToken();

    try {
      // Use PUT method and target the specific article ID
      const response = await fetch(
        `http://localhost:3000/api/news/${articleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (err) {
        throw new Error(`Backend Crash: ${responseText.substring(0, 150)}...`);
      }

      if (response.ok) {
        messageDiv.textContent = "Article updated successfully! Redirecting...";
        messageDiv.className =
          "mt-4 p-4 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";

        setTimeout(() => {
          window.location.href = "/pages/admin/manage.html";
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to update");
      }
    } catch (error) {
      console.error("Submit error:", error);
      messageDiv.textContent = `Error: ${error.message}`;
      messageDiv.className =
        "mt-4 p-4 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
    }
  });
});
