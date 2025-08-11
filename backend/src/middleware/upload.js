const { upload } = require('../config/storage');

// Middleware para upload de arquivo único
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'Arquivo muito grande. Tamanho máximo: 10MB',
            code: 'FILE_TOO_LARGE'
          });
        }

        return res.status(400).json({
          error: err.message || 'Erro no upload do arquivo',
          code: 'UPLOAD_ERROR'
        });
      }
      next();
    });
  };
};

// Middleware para upload de múltiplos arquivos
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'Arquivo muito grande. Tamanho máximo: 10MB',
            code: 'FILE_TOO_LARGE'
          });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: `Máximo de ${maxCount} arquivos permitido`,
            code: 'TOO_MANY_FILES'
          });
        }

        return res.status(400).json({
          error: err.message || 'Erro no upload dos arquivos',
          code: 'UPLOAD_ERROR'
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple
};
