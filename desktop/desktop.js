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
        <div class="window-header">
          <span>Window ${windowCount}</span>
          <div>
            <button class="tools-btn">Tools</button>
            <button class="close-btn">X</button>
          </div>
        </div>
        <div class="window-content">
          <div class="gallery" id="modelGallery">
            <!-- Model cards will be dynamically generated here -->
          </div>
        </div>
        <div class="resize-handle"></div>
      `;
    } else {
      windowEl.innerHTML = `
        <div class="window-header">
          <span>Window ${windowCount}</span>
          <div>
            <button class="tools-btn">Tools</button>
            <button class="close-btn">X</button>
          </div>
        </div>
        <div class="window-content"></div>
        <div class="resize-handle"></div>
      `;
    }

    windowsContainer.appendChild(windowEl);
    makeDraggable(windowEl, windowEl.querySelector('.window-header'));
    makeResizable(windowEl, windowEl.querySelector('.resize-handle'));

    const toolsBtn = windowEl.querySelector('.tools-btn');
    const toolsMenu = createToolsMenu(windowEl);
    toolsBtn.addEventListener('click', () => {
      toolsMenu.style.display = toolsMenu.style.display === 'block' ? 'none' : 'block';
    });

    const closeBtn = windowEl.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      windowEl.remove();
    });

    if (windowCount === 2) {
      // Initialize the gallery
      if (window.modelsConfig && typeof window.initializeGallery === 'function') {
        window.initializeGallery();
      }
    }
  });

  function createToolsMenu(windowEl) {
    const menu = document.createElement('div');
    menu.className = 'tools-menu';
    menu.innerHTML = `
      <ul>
        <li data-tool="clock">Clock</li>
        <li data-tool="calendar">Calendar</li>
        <li data-tool="music">Music Player</li>
      </ul>
    `;
    windowEl.appendChild(menu);

    menu.addEventListener('click', (e) => {
      const tool = e.target.dataset.tool;
      if (tool) {
        const windowContent = windowEl.querySelector('.window-content');
        if (tool === 'clock') {
          const clockEl = document.createElement('div');
          clockEl.style.fontSize = '2em';
          clockEl.style.textAlign = 'center';
          setInterval(() => {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString();
          }, 1000);
          windowContent.innerHTML = '';
          windowContent.appendChild(clockEl);
        } else if (tool === 'calendar') {
          const calendarEl = document.createElement('iframe');
          calendarEl.src = "https://calendar.google.com/calendar/embed?src=59607fd99c223503acfafee38da12994c6738d1e3d909d9633716dd409182b5e%40group.calendar.google.com&ctz=Asia%2FKolkata";
          calendarEl.style.border = "0";
          calendarEl.width = "100%";
          calendarEl.height = "100%";
          calendarEl.frameborder = "0";
          calendarEl.scrolling = "no";
          windowContent.innerHTML = '';
          windowContent.appendChild(calendarEl);
        } else if (tool === 'music') {
          const musicEl = document.createElement('audio');
          musicEl.controls = true;
          musicEl.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
          windowContent.innerHTML = '';
          windowContent.appendChild(musicEl);
        }
        menu.style.display = 'none';
      }
    });

    return menu;
  }

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
