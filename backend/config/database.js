import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/usta-go';

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Bağlantı Hatası:', error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB Bağlantısı Kapatıldı');
  } catch (error) {
    console.error('❌ Bağlantı Kapatma Hatası:', error.message);
  }
};
