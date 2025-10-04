const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log('🔐 Resetting password for arnabcnxamd@gmail.com...');
    
    // New password
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user password
    const updatedUser = await prisma.user.update({
      where: { email: 'arnabcnxamd@gmail.com' },
      data: { password: hashedPassword },
      select: { id: true, email: true, name: true, role: true }
    });
    
    console.log('✅ Password reset successful!');
    console.log('User details:', updatedUser);
    console.log('New password: password123');
    
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('❌ User not found with that email');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();