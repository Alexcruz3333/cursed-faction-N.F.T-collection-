import { Sandpack } from "@codesandbox/sandpack-react";

const sampleCode = `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Interactive Counter</h2>
      <p>Current count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          marginRight: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Increment
      </button>
      <button 
        onClick={() => setCount(count - 1)}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Decrement
      </button>
      <button 
        onClick={() => setCount(0)}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          marginLeft: '10px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset
      </button>
    </div>
  );
}

export default Counter;`;

export function SandpackDemo() {
  return (
    <div className="demo-section">
      <h2>🏗️ Sandpack Live Code Editor</h2>
      <p>
        Edit the React code below and see the changes in real-time! This is powered by 
        <a href="https://sandpack.codesandbox.io/" target="_blank" rel="noopener noreferrer"> CodeSandbox Sandpack</a>.
      </p>
      
      <Sandpack
        template="react-ts"
        files={{
          "/App.tsx": sampleCode,
        }}
        options={{
          showNavigator: false,
          showTabs: false,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: 400,
        }}
        theme="dark"
      />
      
      <div className="tips">
        <h3>💡 Tips:</h3>
        <ul>
          <li>Try changing the button colors by modifying the backgroundColor values</li>
          <li>Add new buttons with different increment values (e.g., +5, +10)</li>
          <li>Modify the styling to create your own design</li>
          <li>Add new state variables to track additional data</li>
        </ul>
      </div>
    </div>
  );
}