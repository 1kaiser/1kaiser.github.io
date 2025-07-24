document.addEventListener('DOMContentLoaded', () => {
  const addWindowBtn = document.getElementById('add-window-btn');
  const windowsContainer = document.getElementById('windows-container');
  let windowCount = 0;

  addWindowBtn.addEventListener('click', () => {
    windowCount++;
    const windowEl = document.createElement('div');
    windowEl.className = 'window';

    if (windowCount === 2) {
      windowEl.innerHTML = `
        <div class="window-header">Window ${windowCount}</div>
        <div class="window-content">
          <div class="gallery" id="modelGallery">
            <!-- Model cards will be dynamically generated here -->
          </div>
        </div>
        <div class="resize-handle"></div>
      `;
    } else {
      windowEl.innerHTML = `
        <div class="window-header">Window ${windowCount}</div>
        <div class="window-content"></div>
        <div class="resize-handle"></div>
      `;
    }

    windowsContainer.appendChild(windowEl);
    makeDraggable(windowEl, windowEl.querySelector('.window-header'));
    makeResizable(windowEl, windowEl.querySelector('.resize-handle'));

    if (windowCount === 2) {
      // Initialize the gallery
      if (window.modelsConfig && typeof window.initializeGallery === 'function') {
        window.initializeGallery();
      }
    }
  });

  function makeResizable(element, handle) {
    let original_width = 0;
    let original_height = 0;
    let original_x = 0;
    let original_y = 0;
    let original_mouse_x = 0;
    let original_mouse_y = 0;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
      original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
      original_x = element.getBoundingClientRect().left;
      original_y = element.getBoundingClientRect().top;
      original_mouse_x = e.pageX;
      original_mouse_y = e.pageY;
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    });

    function resize(e) {
      const width = original_width + (e.pageX - original_mouse_x);
      const height = original_height + (e.pageY - original_mouse_y);
      element.style.width = width + 'px';
      element.style.height = height + 'px';
    }

    function stopResize() {
      window.removeEventListener('mousemove', resize);
    }
  }

  function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragMouseDown = (e) => {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    const elementDrag = (e) => {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    };

    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };

    if (handle) {
      handle.onmousedown = dragMouseDown;
    } else {
      element.onmousedown = dragMouseDown;
    }
  }
});
