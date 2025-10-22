# 🔧 dots.ocr Troubleshooting Guide

## Common Issues and Solutions

### 1. **Model Download Issues**

**Problem**: Model weights not downloading or corrupted
```bash
# Error: Model not found or download failed
FileNotFoundError: [Errno 2] No such file or directory: './weights/DotsOCR'
```

**Solutions**:
```bash
# Method 1: Direct download
python3 tools/download_model.py

# Method 2: Using ModelScope (for China users)
python3 tools/download_model.py --type modelscope

# Method 3: Manual download from HuggingFace
git lfs install
git clone https://huggingface.co/rednote-hilab/dots.ocr ./weights/DotsOCR

# Method 4: Check disk space and permissions
df -h  # Check disk space
ls -la ./weights/  # Check permissions
```

### 2. **vLLM Server Issues**

**Problem**: vLLM server not starting or crashing
```bash
# Common errors:
# - CUDA out of memory
# - Model registration failed
# - Port already in use
```

**Solutions**:
```bash
# Check GPU memory
nvidia-smi

# Kill existing processes on port 8000
lsof -ti:8000 | xargs kill -9

# Launch with proper memory settings
CUDA_VISIBLE_DEVICES=0 vllm serve ./weights/DotsOCR \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.8 \
  --max-model-len 8192 \
  --trust-remote-code \
  --served-model-name model

# For lower memory GPUs
CUDA_VISIBLE_DEVICES=0 vllm serve ./weights/DotsOCR \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.6 \
  --max-model-len 4096 \
  --trust-remote-code
```

### 3. **Dependencies Issues**

**Problem**: Package conflicts or missing dependencies
```bash
# Common errors:
# - flash-attn installation failed
# - transformers version conflict
# - CUDA version mismatch
```

**Solutions**:
```bash
# Create clean environment
conda create -n dots_ocr python=3.12
conda activate dots_ocr

# Install PyTorch first (adjust CUDA version)
pip install torch==2.7.0 torchvision==0.22.0 torchaudio==2.7.0 --index-url https://download.pytorch.org/whl/cu118

# Install flash-attention (if needed)
pip install flash-attn==2.8.0.post2 --no-build-isolation

# Install other dependencies
pip install transformers==4.51.3
pip install -e .

# Alternative: Use Docker
docker pull rednotehilab/dots.ocr
docker run -it --gpus all rednotehilab/dots.ocr
```

### 4. **Model Registration Issues**

**Problem**: vLLM can't find the model class
```bash
# Error: Model class not registered
ValueError: Model class DotsOCRForCausalLM is not supported
```

**Solutions**:
```bash
# Method 1: Use vLLM 0.11.0+ (officially supported)
pip install vllm>=0.11.0
vllm serve rednote-hilab/dots.ocr --trust-remote-code

# Method 2: Manual registration (for older vLLM)
export PYTHONPATH=./weights/DotsOCR:$PYTHONPATH
sed -i '/^from vllm\.entrypoints\.cli\.main import main$/a\
from DotsOCR import modeling_dots_ocr_vllm' `which vllm`

# Method 3: Use HuggingFace instead
python demo/demo_hf.py
```

### 5. **Memory Issues**

**Problem**: Out of memory errors
```bash
# CUDA out of memory
# CPU memory exhausted
```

**Solutions**:
```bash
# Reduce batch size and memory usage
vllm serve ./weights/DotsOCR \
  --gpu-memory-utilization 0.6 \
  --max-model-len 4096 \
  --max-num-batched-tokens 2048

# Use CPU inference (slower but works)
python demo/demo_hf.py  # Will use CPU if no GPU

# Process smaller images
python dots_ocr/parser.py input.pdf --max_pixels 1024000
```

### 6. **API Connection Issues**

**Problem**: Can't connect to vLLM server
```bash
# Connection refused
# Timeout errors
```

**Solutions**:
```bash
# Check if server is running
curl http://localhost:8000/health

# Check server logs
vllm serve ./weights/DotsOCR --trust-remote-code --log-level debug

# Test with different port
vllm serve ./weights/DotsOCR --port 8001 --trust-remote-code

# Update demo to use correct port
python demo/demo_vllm.py --port 8001
```

### 7. **Image Processing Issues**

**Problem**: Images not processing correctly
```bash
# Unsupported image format
# Image too large
# Corrupted files
```

**Solutions**:
```bash
# Check supported formats
python -c "from dots_ocr.utils.consts import image_extensions; print(image_extensions)"

# Resize large images
python dots_ocr/parser.py input.jpg --max_pixels 1024000

# Convert image format
from PIL import Image
img = Image.open('input.webp')
img.save('input.jpg', 'JPEG')

# Use fitz preprocessing for PDFs
python dots_ocr/parser.py input.pdf --dpi 150
```

## 🚀 Quick Setup Script

Create this script to automate the setup:

```bash
#!/bin/bash
# setup_dots_ocr.sh

set -e

echo "🔧 Setting up dots.ocr..."

# Create environment
conda create -n dots_ocr python=3.12 -y
conda activate dots_ocr

# Install PyTorch
pip install torch==2.7.0 torchvision==0.22.0 torchaudio==2.7.0 --index-url https://download.pytorch.org/whl/cu118

# Clone repository
git clone https://github.com/rednote-hilab/dots.ocr.git
cd dots.ocr

# Install dependencies
pip install -e .

# Download model
python3 tools/download_model.py

# Test installation
echo "🧪 Testing installation..."
python -c "import dots_ocr; print('✅ dots_ocr imported successfully')"

# Launch vLLM server
echo "🚀 Launching vLLM server..."
vllm serve ./weights/DotsOCR --trust-remote-code --served-model-name model &

# Wait for server to start
sleep 30

# Test API
echo "🔍 Testing API..."
python demo/demo_vllm.py

echo "✅ Setup complete!"
```

## 🔍 Diagnostic Commands

```bash
# Check GPU
nvidia-smi

# Check Python environment
python --version
pip list | grep -E "(torch|transformers|vllm|flash-attn)"

# Check model files
ls -la ./weights/DotsOCR/
du -sh ./weights/DotsOCR/

# Check server status
curl http://localhost:8000/health
curl http://localhost:8000/v1/models

# Test inference
python -c "
from dots_ocr.parser import DotsOCRParser
parser = DotsOCRParser(use_hf=True)
print('✅ Parser initialized successfully')
"
```

## 🐛 Common Error Messages and Fixes

### Error: "flash-attn installation failed"
```bash
# Solution 1: Install without build isolation
pip install flash-attn==2.8.0.post2 --no-build-isolation

# Solution 2: Use pre-compiled wheel
pip install https://github.com/Dao-AILab/flash-attention/releases/download/v2.8.0.post2/flash_attn-2.8.0.post2+cu118torch2.7cxx11abiFALSE-cp312-cp312-linux_x86_64.whl

# Solution 3: Skip flash attention
# Edit model config to use standard attention
```

### Error: "Model class not found"
```bash
# Use newer vLLM version
pip install vllm>=0.11.0

# Or use HuggingFace transformers
python demo/demo_hf.py
```

### Error: "CUDA out of memory"
```bash
# Reduce memory usage
vllm serve ./weights/DotsOCR --gpu-memory-utilization 0.6 --max-model-len 4096

# Use smaller images
python dots_ocr/parser.py input.pdf --max_pixels 512000
```

## 📞 Getting Help

1. **Check GitHub Issues**: https://github.com/rednote-hilab/dots.ocr/issues
2. **Read Documentation**: Check README.md for latest updates
3. **Try Docker**: Use the official Docker image for easier setup
4. **Use HuggingFace**: If vLLM fails, try the HuggingFace demo

## 🎯 Recommended Workflow

1. **Start Simple**: Use `demo/demo_hf.py` first to test basic functionality
2. **Check Dependencies**: Ensure all packages are correctly installed
3. **Test with Small Files**: Start with small images before processing large PDFs
4. **Monitor Resources**: Watch GPU/CPU memory usage
5. **Use Docker**: For production deployments, use the Docker image

This should help you identify and fix the most common issues with dots.ocr! 🚀