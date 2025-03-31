import { useParams } from '@solidjs/router';
import { createMemo } from 'solid-js';
import ModelViewer from '../components/ModelViewer';
import { models } from '../data/modelData';

const ModelDetailPage = () => {
  const params = useParams();
  
  const model = createMemo(() => {
    return models.find(m => m.id === params.id) || models[0];
  });

  return (
    <>
      <h2>{model().title}</h2>
      <div style={{ "max-width": "800px", "margin": "0 auto" }}>
        <ModelViewer
          modelSrc={model().src}
          alt={model().title}
          autoRotate={model().autoRotate}
          shadowIntensity={model().shadowIntensity}
        />
        <div style={{ "margin-top": "20px" }}>
          <h3>Description</h3>
          <p>{model().description}</p>
        </div>
      </div>
    </>
  );
};

export default ModelDetailPage;
