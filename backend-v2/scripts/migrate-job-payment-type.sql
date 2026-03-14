-- prisma db push sonrası bir kez çalıştırın:
-- Eski "İş ödemesi" kayıtları yanlışlıkla WITHDRAWAL idi; JOB_PAYMENT olmalı.
UPDATE "Transaction" SET type = 'JOB_PAYMENT' WHERE type = 'WITHDRAWAL' AND description LIKE 'İş ödemesi%';
