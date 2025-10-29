# AI Lecture Summarizer 🎓

An intelligent system that transcribes and summarizes lecture recordings into concise, organized notes using AI.

## Features ✨

- 🎤 Upload lecture recordings (audio/video)
- 🔄 Automatic transcription using OpenAI's Whisper
- 📝 AI-powered summarization of lecture content
- 📂 Organized storage of original files, transcripts, and summaries
- 🚀 FastAPI backend with asynchronous processing
- 💅 Modern React frontend

## Tech Stack 🛠️

### Backend
- Python 3.9+
- FastAPI
- OpenAI Whisper (for transcription)
- OpenAI GPT (for summarization)
- SQLite (for data storage)
- FFmpeg (for audio processing)

### Frontend
- React
- TypeScript
- Material-UI
- Axios for API calls

## Prerequisites 📋

- Python 3.9 or higher
- Node.js 16+ and npm/yarn
- FFmpeg installed and added to PATH
- OpenAI API key

## Setup and Installation 🛠️

### 1. Clone the repository
```bash
git clone <repository-url>
cd ai-lecture-summarizer
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On macOS/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application 🚀

### Start the Backend
From the backend directory:
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`

### Start the Frontend
From the frontend directory:
```bash
npm start
```
The frontend will be available at `http://localhost:3000`

## API Endpoints 🌐

### Upload a Lecture
- **POST** `/upload`
  - Upload a lecture file (audio/video)
  - Returns a job ID for tracking

### Check Status
- **GET** `/status/{job_id}`
  - Check the status of a processing job
  - Returns the summary when complete

## Project Structure 📁

```
ai-lecture-summarizer/
├── backend/               # FastAPI backend
│   ├── main.py           # Main application
│   ├── requirements.txt  # Python dependencies
│   ├── uploads/          # Store uploaded lecture files
│   ├── transcripts/      # Store transcript files
│   └── summaries/        # Store summary files
└── frontend/             # React frontend
    ├── public/
    └── src/
        ├── components/   # React components
        ├── services/     # API services
        └── App.tsx       # Main App component
```

## Environment Variables 🔧

### Backend
- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Port for the FastAPI server (default: 8000)

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- OpenAI for their amazing Whisper and GPT models
- FastAPI for the awesome Python web framework
- React for the frontend framework

---

<div align="center">
  Made with ❤️ by Abhishek Rawal
</div>
