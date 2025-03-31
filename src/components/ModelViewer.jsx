import { createEffect, createSignal, Show } from 'solid-js';

const importModelViewer = async () => {
  if (!customElements.get('model-viewer')) {
    await import('@google/model-viewer');
  }
};

const ModelViewer = (props) => {
  const [showQR, setShowQR] = createSignal(false);
  
  createEffect(() => {
    importModelViewer();
  });

  const toggleQR = () => setShowQR(!showQR());
  
  // Generate QR code URL for the model
  const getQRCodeUrl = () => {
    const modelUrl = new URL(props.modelSrc, window.location.origin).href;
    const pageUrl = `${window.location.origin}/view.html?model=${encodeURIComponent(modelUrl)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pageUrl)}`;
  };

  return (
    <div class="model-container">
      <model-viewer
        src={props.modelSrc}
        alt={props.alt || 'A 3D model'}
        camera-controls
        auto-rotate={props.autoRotate ?? true}
        shadow-intensity={props.shadowIntensity || "1"}
        exposure={props.exposure || "1"}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
      >
        {/* Custom AR button for mobile */}
        <button slot="ar-button" class="ar-button">
          👋 View in your space
        </button>
        
        {/* QR code toggle button for desktop */}
        <button class="qr-toggle" onClick={toggleQR}>
          📱 View on mobile
        </button>
      </model-viewer>
      
      {/* QR code popup */}
      <Show when={showQR()}>
        <>
          <div class="backdrop" onClick={toggleQR}></div>
          <div class="qr-popup">
            <button class="close-btn" onClick={toggleQR}>×</button>
            <h4>Scan to view on mobile</h4>
            <img src={getQRCodeUrl()} alt="QR Code for mobile view" width="150" height="150" />
            <p>Scan this code with your phone's camera</p>
          </div>
        </>
      </Show>
    </div>
  );
};

export default ModelViewer;
