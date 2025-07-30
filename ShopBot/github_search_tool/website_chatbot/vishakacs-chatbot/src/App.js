import { DeepChat } from '@deep-chat/react';
import '@deep-chat/react/dist/style.css';
import './App.css';

function App() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: '20px',
      boxSizing: 'border-box',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        height: '80vh',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <DeepChat
          style={{ 
            borderRadius: '12px',
            height: '100%',
            width: '100%'
          }}
          textInput={{ 
            placeholder: { 
              text: 'Ask ShopBot anything...',
              style: { color: '#666' }
            },
            style: {
              backgroundColor: '#fff',
              borderRadius: '20px',
              padding: '10px 20px',
              border: '1px solid #ddd'
            }
          }}
          stream={true}
          styleConstants={{
            colors: {
              primary: '#4a90e2',
              secondary: '#f5f5f5',
              accentText: '#4a90e2',
              text: '#333',
              textOnPrimary: '#fff',
            },
            borderRadius: {
              container: '12px'
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;
