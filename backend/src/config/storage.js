const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Função para criar diretórios de upload
const createUploadDirs = () => {
  const baseDir = path.join(__dirname, '../../uploads');
  const dirs = [
    baseDir,
    path.join(baseDir, 'avatars'),
    path.join(baseDir, 'profiles'),
    path.join(baseDir, 'knowledge'),
    path.join(baseDir, 'general')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Diretório criado: ${dir}`);
    }
  });
};

// Criar diretórios na inicialização
createUploadDirs();

// Configuração do multer para storage local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(__dirname, '../../uploads');

    // Separar arquivos por tipo baseado na rota
    if (req.path.includes('avatar')) {
      uploadPath = path.join(uploadPath, 'avatars');
    } else if (req.path.includes('profile-picture')) {
      uploadPath = path.join(uploadPath, 'profiles');
    } else if (req.path.includes('knowledge')) {
      uploadPath = path.join(uploadPath, 'knowledge');
    } else {
      uploadPath = path.join(uploadPath, 'general');
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para evitar conflitos
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const uniqueName = `${timestamp}-${randomNum}${extension}`;
    cb(null, uniqueName);
  }
});

// Configuração do multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB padrão
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') ||
      ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt'];

    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);

    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${fileExtension}. Tipos permitidos: ${allowedTypes.join(', ')}`));
    }
  }
});

// Função para upload local (substitui uploadToS3)
const uploadToLocal = async (file, folder = 'general') => {
  try {
    // O arquivo já foi salvo pelo multer, só precisamos retornar a URL
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const fileUrl = `${baseUrl}/uploads/${folder}/${file.filename}`;

    console.log(`📁 Arquivo salvo: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    throw new Error('Erro ao salvar arquivo localmente: ' + error.message);
  }
};

// Função para deletar arquivo local (substitui deleteFromS3)
const deleteFromLocal = async (fileUrl) => {
  try {
    // Extrair o caminho do arquivo da URL
    const urlParts = fileUrl.split('/uploads/');
    if (urlParts.length < 2) return false;

    const filePath = path.join(__dirname, '../../uploads', urlParts[1]);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Arquivo deletado: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
};

// Função para gerar URL pública
const getFileUrl = (filename, folder = 'general') => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

module.exports = {
  upload,
  uploadToLocal,
  deleteFromLocal,
  getFileUrl,
  createUploadDirs
};