# 🎮 Cursed Faction - React Frontend Demo

A React frontend application showcasing Sandpack live code editor and AI integrations (OpenAI and HuggingFace). Built with Vite and TypeScript for fast development and optimal performance.

## ✨ Features

- **🏗️ Sandpack Live Code Editor**: Interactive React code editor with real-time preview
- **🤖 OpenAI Integration**: Demo for GPT-3.5-turbo API integration
- **🤗 HuggingFace Integration**: Demo for HuggingFace Inference API with multiple models
- **⚡ Fast Development**: Built with Vite for lightning-fast HMR
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **🎨 Modern UI**: Clean, professional interface optimized for development workflows

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

1. **Navigate to the web directory**:
   ```bash
   cd web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:5173`

## 🔧 API Keys Setup

### OpenAI API Key

1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Navigate to [API Keys](https://platform.openai.com/api-keys)
3. Create a new API key
4. Add it to your `.env` file or use the form in the app

### HuggingFace API Key

1. Create an account at [HuggingFace](https://huggingface.co)
2. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
3. Create a new token with read permissions
4. Add it to your `.env` file or use the form in the app

## 📁 Project Structure

```
web/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── SandpackDemo.tsx      # Sandpack live editor
│   │   ├── OpenAIDemo.tsx        # OpenAI integration
│   │   └── HuggingFaceDemo.tsx   # HuggingFace integration
│   ├── App.tsx            # Main application component
│   ├── App.css            # Application styles
│   ├── main.tsx           # Application entry point
│   └── vite-env.d.ts      # Vite type definitions
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── README.md              # This file
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔌 Component Usage

### Sandpack Editor

```tsx
import { SandpackDemo } from './components/SandpackDemo';

// Use in your component
<SandpackDemo />
```

### OpenAI Integration

```tsx
import { OpenAIDemo } from './components/OpenAIDemo';

// Use in your component
<OpenAIDemo />
```

### HuggingFace Integration

```tsx
import { HuggingFaceDemo } from './components/HuggingFaceDemo';

// Use in your component
<HuggingFaceDemo />
```

## 🔒 Security Notes

**⚠️ Important**: This demo includes API keys in the frontend for demonstration purposes only.

### For Production:

1. **Never expose API keys in frontend code**
2. **Move all AI API calls to your backend server**
3. **Use environment variables on the server side**
4. **Implement proper authentication and rate limiting**
5. **Use HTTPS for all API communications**

### Recommended Production Architecture:

```
Frontend (React) → Backend API → OpenAI/HuggingFace APIs
```

## 🎯 Use Cases

This demo is perfect for:

- **Cursor AI Development**: Ready-to-use components for AI-assisted coding
- **Prototyping**: Quickly test AI integrations and live code editing
- **Learning**: Understand how to integrate modern AI APIs with React
- **Development Tools**: Build internal tools with live code capabilities

## 📦 Dependencies

### Core Dependencies
- `react` - UI library
- `typescript` - Type safety
- `vite` - Build tool and dev server

### Integration Dependencies
- `@codesandbox/sandpack-react` - Live code editor
- `openai` - OpenAI API client
- `@huggingface/inference` - HuggingFace API client

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Cursed Faction NFT Vault System and follows the same license.

## 🆘 Support

For issues and questions:

1. Check the [main repository issues](https://github.com/Alexcruz3333/cursed-faction-N.F.T-collection-/issues)
2. Review the [API documentation](https://platform.openai.com/docs) for OpenAI
3. Check [HuggingFace documentation](https://huggingface.co/docs) for HuggingFace APIs

## 🔗 Related Links

- [Sandpack Documentation](https://sandpack.codesandbox.io/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [HuggingFace Inference API](https://huggingface.co/docs/inference-api)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)