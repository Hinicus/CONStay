import { auth } from "/firebase-client.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Quill Editor
  const quill = new Quill("#editor-container", {
    theme: "snow",
    placeholder: "Write the full article here...",
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }], // Headings
        ["bold", "italic", "underline"], // Text formatting
        [{ list: "ordered" }, { list: "bullet" }], // Lists
        ["link"], // Links
        ["clean"], // Remove formatting button
      ],
    },
  });

  // --- Snippet Character Counter ---
  const snippetInput = document.getElementById("snippet");
  const snippetCounter = document.getElementById("snippet-counter");
  snippetInput.addEventListener("input", () => {
    snippetCounter.textContent = `${snippetInput.value.length} / 150`;
  });

  // --- Image Mode Toggle Logic ---
  const imageModeRadios = document.getElementsByName("imageMode");
  const uploadContainer = document.getElementById("upload-container");
  const linkContainer = document.getElementById("link-container");
  const imageMetaContainer = document.getElementById("image-meta-container");
  const imageFile = document.getElementById("imageFile");
  const imageUrl = document.getElementById("imageUrl");

  imageModeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "upload") {
        uploadContainer.classList.remove("hidden");
        linkContainer.classList.add("hidden");
        imageMetaContainer.classList.remove("hidden");
        imageUrl.value = "";
      } else if (e.target.value === "link") {
        uploadContainer.classList.add("hidden");
        linkContainer.classList.remove("hidden");
        imageMetaContainer.classList.remove("hidden");
        imageFile.value = "";
      } else if (e.target.value === "none") {
        // Hide everything and clear values
        uploadContainer.classList.add("hidden");
        linkContainer.classList.add("hidden");
        imageMetaContainer.classList.add("hidden");
        imageFile.value = "";
        imageUrl.value = "";
        document.getElementById("imageCaption").value = "";
        document.getElementById("imageCredit").value = "";
      }
    });
  });

  const form = document.getElementById("create-news-form");
  const messageDiv = document.getElementById("form-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Stop the page from reloading

    // 1. Extract HTML from Quill
    const richTextContent = quill.root.innerHTML;

    if (richTextContent === "<p><br></p>") {
      alert("Please write some content before publishing.");
      return;
    }

    // 2. Create FormData (REQUIRED for file uploads)
    const formData = new FormData();

    // 3. Append all the text fields
    formData.append("title", document.getElementById("title").value);
    formData.append("snippet", document.getElementById("snippet").value);
    formData.append("content", richTextContent); // Use Quill's HTML here!
    formData.append(
      "imageCaption",
      document.getElementById("imageCaption").value,
    );
    formData.append(
      "imageCredit",
      document.getElementById("imageCredit").value,
    );
    formData.append("authorId", sessionStorage.getItem("currentUserId"));
    formData.append("authorName", sessionStorage.getItem("userName"));

    // 4. Append either the file OR the link based on the radio button
    const selectedMode = document.querySelector(
      'input[name="imageMode"]:checked',
    ).value;

    if (selectedMode === "upload" && imageFile.files.length > 0) {
      const file = imageFile.files[0];
      const maxSizeBytes = 5 * 1024 * 1024; // 10MB Cloudinary limit

      if (file.size > maxSizeBytes) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        messageDiv.textContent = `Error: Image is too large (${fileSizeMB}MB). Maximum allowed size is 5MB.`;
        messageDiv.className =
          "mt-4 p-4 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
        return;
      }
      formData.append("imageFile", imageFile.files[0]);
    } else if (selectedMode === "link" && imageUrl.value) {
      formData.append("imageUrl", imageUrl.value);
    } else if (selectedMode === "none") {
      // Do nothing! Let the form submit without an image attached.
    } else {
      alert("Please provide an image file, a web link, or select 'No Image'.");
      return;
    }

    messageDiv.textContent = "Uploading article... please wait.";
    messageDiv.className =
      "mt-4 p-4 rounded-lg text-sm font-bold bg-[#f5ede0] text-[#12284b] block";

    //Check to see if Firebase knows who is logged in
    if (!auth.currentUser) {
      messageDiv.textContent =
        "Authentication error: Please refresh the page and try again.";
      messageDiv.className =
        "mt-4 p-4 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
      return;
    }

    // Get token
    const token = await auth.currentUser.getIdToken();

    try {
      // 5. Send the POST request to the backend
      const response = await fetch("http://localhost:3000/api/news", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // CRITICAL: Do NOT set 'Content-Type': 'application/json' when sending FormData.
        // The browser will automatically set the correct headers for the file upload.
        body: formData,
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (err) {
        throw new Error(
          `Server returned an invalid response (${response.status}). Check server console.`,
        );
      }

      if (response.ok) {
        messageDiv.textContent =
          "Article published successfully! Redirecting...";
        messageDiv.className =
          "mt-4 p-4 rounded-lg text-sm font-bold bg-[#d7e2ff] text-[#021b3d] block";

        form.reset();
        quill.setContents([]); // Clear the Quill editor

        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to publish");
      }
    } catch (error) {
      console.error("Submit error:", error);
      messageDiv.textContent = `Error: ${error.message}`;
      messageDiv.className =
        "mt-4 p-4 rounded-lg text-sm font-bold bg-[#ffdad6] text-[#93000a] block";
    }
  });
});
