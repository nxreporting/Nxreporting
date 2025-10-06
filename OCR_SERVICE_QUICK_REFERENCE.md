# OCR Service - Quick Reference Card

## 🚀 Quick Start

```typescript
import { ocrService } from '@/lib/services/multiProviderOCRService';

// Extract text from PDF
const result = await ocrService.extractFromBuffer(fileBuffer, 'document.pdf');

if (result.success) {
  console.log('Text:', result.extractedText);
  console.log('Provider:', result.provider);
} else {
  console.error('Error:', result.error);
}
```

---

## 📋 Environment Variables

```bash
# Required
OCR_SPACE_API_KEY="your-key"

# Optional
NANONETS_API_KEY="your-key"
NANONETS_MODEL_ID="your-model-id"
```

---

## 🔄 Provider Order

1. **Nanonets** (if configured) → Best for pharmaceutical docs
2. **OCR.space** (always available) → Reliable, free tier
3. **Fallback** (always available) → Returns file info only

---

## 📊 Response Format

```typescript
{
  success: boolean;
  extractedText?: string;
  provider?: string;
  error?: string;
  metadata?: {
    attempts: number;
    duration: number;
    fileSize: number;
  }
}
```

---

## 🔍 Common Issues

### "All OCR providers failed"
```bash
# Check API keys
echo $OCR_SPACE_API_KEY

# Add to .env.local
OCR_SPACE_API_KEY="your-key"
```

### "File too large"
```bash
# Compress PDF
gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=compressed.pdf input.pdf
```

### "Extraction timeout"
```typescript
// Increase timeout
const result = await withTimeout(
  ocrService.extractFromBuffer(buffer, filename),
  60000, // 60 seconds
  'Timeout'
);
```

---

## 📈 Performance Tips

### Small Files (<5MB)
- Uses base64 encoding
- More reliable
- ~2-3 seconds

### Large Files (>5MB)
- Uses multipart upload
- Less memory
- ~4-8 seconds

### Caching
```typescript
const cache = new LRUCache({ max: 100, ttl: 3600000 });
const cached = cache.get(fileHash);
if (cached) return cached;
```

---

## 🔒 Security Checklist

- [ ] API keys in environment variables only
- [ ] `.env.local` in `.gitignore`
- [ ] Keys rotated every 90 days
- [ ] No keys in logs
- [ ] Input validation enabled

---

## 🧪 Testing

```typescript
// Unit test
const result = await ocrService.extractFromBuffer(testBuffer, 'test.pdf');
expect(result.success).toBe(true);

// Check status
const status = ocrService.getStatus();
console.log('Ready:', status.ready);
```

---

## 📊 Monitoring

```typescript
// Track metrics
console.log('Provider:', result.provider);
console.log('Duration:', result.metadata?.duration, 'ms');
console.log('Attempts:', result.metadata?.attempts);

// Analytics
track('ocr_extraction', {
  provider: result.provider,
  success: result.success,
  duration: result.metadata?.duration
});
```

---

## 🔗 Quick Links

- **Full Documentation**: `frontend/lib/services/README_OCR_SERVICE.md`
- **Migration Guide**: `MIGRATION_GUIDE_OCR_SERVICE.md`
- **Troubleshooting**: See README section "Troubleshooting"
- **API Docs**: 
  - [OCR.space](https://ocr.space/ocrapi)
  - [Nanonets](https://nanonets.com/documentation/)

---

## 💡 Pro Tips

1. **Always check `result.success` before using data**
2. **Log `result.provider` to track which service is used**
3. **Monitor `result.metadata.attempts` for retry patterns**
4. **Use different API keys for dev/prod**
5. **Enable caching for repeated extractions**

---

## 🆘 Need Help?

1. Check logs for specific errors
2. Verify API keys are correct
3. Test providers manually with curl
4. Review full documentation
5. Check provider status pages

---

**Version**: 2.0.0 | **Last Updated**: January 2025
