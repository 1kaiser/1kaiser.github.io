import { useState, useEffect, useRef } from 'react';
import { init, get_color_thief } from './libs/color-thief.js';
import './App.css';

function App() {
  const [dominantColor, setDominantColor] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  // Initialize the WASM module when the component mounts
  useEffect(() => {
    async function initialize() {
      try {
        await init();
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to initialize WASM module", e);
        setError("Error: Could not load the color extraction engine. Please check the console.");
        setIsLoading(false);
      }
    }
    initialize();
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setDominantColor(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      setImgSrc(e.target.result);

      const img = new Image();
      img.onload = ()_ => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);

        // Get pixel data
        const imageData = context.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;

        try {
          // Call the WASM function
          const dominant = get_color_thief(pixels, pixels.length, 10, 1);
          if (dominant && dominant.length === 3) {
            const [r, g, b] = dominant;
            setDominantColor(`rgb(${r}, ${g}, ${b})`);
          } else {
             setError("Could not determine dominant color.");
          }
        } catch(e) {
            console.error("Error calling WASM function:", e);
            setError("An error occurred during color extraction.");
        }
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <div>Loading Color Engine...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="App">
      <header>
        <h1>WASM Color Extractor</h1>
        <p>Upload an image to find its dominant color using WebAssembly.</p>
      </header>
      <div className="card">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <div className="result-container">
          {imgSrc && <img src={imgSrc} alt="Uploaded" className="preview-img" />}
          {dominantColor && (
            <div className="color-box-container">
              <div className="color-box" style={{ backgroundColor: dominantColor }}></div>
              <p>{dominantColor}</p>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

export default App;
