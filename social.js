// Simple social media functionality for posts, likes, comments

document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('postsGrid');
    const uploadForm = document.getElementById('uploadForm');
    const preview = document.getElementById('preview');

    // Load posts from localStorage or initialize empty array
    let posts = JSON.parse(localStorage.getItem('posts')) || [];

    // Render posts in feed
    function renderPosts() {
        if (!postsGrid) return;
        postsGrid.innerHTML = '';
        posts.slice().reverse().forEach((post, index) => {
            const postElement = document.createElement('div');
            postElement.className = 'post-card';

            let mediaElement;
            if (post.type === 'photo' || post.type === 'reel') {
                mediaElement = document.createElement('img');
                mediaElement.src = post.data;
                mediaElement.alt = post.caption || 'Post image';
                mediaElement.className = 'post-media';
            } else if (post.type === 'video') {
                mediaElement = document.createElement('video');
                mediaElement.src = post.data;
                mediaElement.controls = true;
                mediaElement.className = 'post-media';
            }

            const caption = document.createElement('p');
            caption.textContent = post.caption || '';

            const likeButton = document.createElement('button');
            likeButton.textContent = `❤️ ${post.likes || 0}`;
            likeButton.className = 'like-button';
            likeButton.addEventListener('click', () => {
                posts[index].likes = (posts[index].likes || 0) + 1;
                savePosts();
                renderPosts();
            });

            postElement.appendChild(mediaElement);
            postElement.appendChild(caption);
            postElement.appendChild(likeButton);

            postsGrid.appendChild(postElement);
        });
    }

    // Save posts to localStorage
    function savePosts() {
        localStorage.setItem('posts', JSON.stringify(posts));
    }

    // Handle file preview on upload page
    if (uploadForm) {
        const mediaFileInput = document.getElementById('mediaFile');
        const mediaTypeSelect = document.getElementById('mediaType');
        const captionInput = document.getElementById('caption');

        mediaFileInput.addEventListener('change', () => {
            const file = mediaFileInput.files[0];
            if (!file) {
                preview.innerHTML = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = e => {
                preview.innerHTML = '';
                let previewElement;
                if (mediaTypeSelect.value === 'video' || mediaTypeSelect.value === 'reel') {
                    previewElement = document.createElement('video');
                    previewElement.src = e.target.result;
                    previewElement.controls = true;
                    previewElement.className = 'preview-media';
                } else {
                    previewElement = document.createElement('img');
                    previewElement.src = e.target.result;
                    previewElement.className = 'preview-media';
                }
                preview.appendChild(previewElement);
            };
            reader.readAsDataURL(file);
        });

        uploadForm.addEventListener('submit', e => {
            e.preventDefault();
            const file = mediaFileInput.files[0];
            if (!file) {
                alert('Please select a file to upload.');
                return;
            }
            const reader = new FileReader();
            reader.onload = e => {
                const newPost = {
                    type: mediaTypeSelect.value,
                    data: e.target.result,
                    caption: captionInput.value,
                    likes: 0,
                    timestamp: new Date().toISOString()
                };
                posts.push(newPost);
                savePosts();
                alert('Post uploaded successfully!');
                uploadForm.reset();
                preview.innerHTML = '';
            };
            reader.readAsDataURL(file);
        });
    }

    renderPosts();
});
