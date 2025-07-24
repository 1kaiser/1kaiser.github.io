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
      `;
    } else {
      windowEl.innerHTML = `
        <div class="window-header">Window ${windowCount}</div>
        <div class="window-content"></div>
      `;
    }

    windowsContainer.appendChild(windowEl);
    makeDraggable(windowEl, windowEl.querySelector('.window-header'));

    if (windowCount === 2) {
      // Initialize the gallery
      if (window.modelsConfig && typeof window.initializeGallery === 'function') {
        window.initializeGallery();
      }
    }
  });

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
