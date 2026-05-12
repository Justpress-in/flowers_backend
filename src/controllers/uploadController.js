const { cloudinary, uploadBuffer } = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

exports.single = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const result = await uploadBuffer(req.file.buffer);
  res.status(201).json({
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  });
});

exports.multiple = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const results = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer)));
  res.status(201).json({
    files: results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
      width: r.width,
      height: r.height,
      bytes: r.bytes,
    })),
  });
});

exports.destroy = asyncHandler(async (req, res) => {
  const publicId = req.body?.publicId || req.query?.publicId;
  if (!publicId) return res.status(400).json({ message: 'publicId is required' });
  const result = await cloudinary.uploader.destroy(publicId);
  res.json({ result });
});
