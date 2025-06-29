const { pool } = require('../config/database');
const { sendEmail } = require('../config/email');

class ActivityLogger {
    static async log(empresa_id, user, action, details = {}) {
        try {
            // Log no banco de dados
            const logQuery = `
                INSERT INTO activity_logs 
                (empresa_id, user_id, user_full_name, product_id, action, details, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;
            
            await pool.query(logQuery, [
                empresa_id,
                user.id,
                user.full_name || user.username,
                details.produtoId || null,
                action,
                JSON.stringify(details)
            ]);

            // Verificar se notificações estão habilitadas
            const [[settings]] = await pool.query(
                'SELECT notifications_enabled, notification_email FROM empresas WHERE id = ?',
                [empresa_id]
            );

            // Enviar notificação por e-mail se habilitada
            if (settings?.notifications_enabled && settings?.notification_email) {
                await this.sendNotificationEmail(settings.notification_email, action, details, user);
            }

            console.log(`📝 Log registrado: ${action} por ${user.username}`);
            return true;
        } catch (error) {
            console.error('❌ Erro no sistema de log:', error.message);
            return false;
        }
    }

    static async sendNotificationEmail(email, action, details, user) {
        const actionLabels = {
            'product_created': 'Produto Criado',
            'product_updated': 'Produto Atualizado',
            'product_deleted': 'Produto Deletado',
            'stock_adjusted': 'Estoque Ajustado',
            'user_created': 'Usuário Criado',
            'user_updated': 'Usuário Atualizado',
            'user_deleted': 'Usuário Deletado'
        };

        const mailOptions = {
            from: '"StockCtrl Notificações" <notifications@stockctrl.com>',
            to: email,
            subject: `🔔 Alerta de Atividade: ${actionLabels[action] || action}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">🔔 Notificação de Atividade</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #34495e; margin-top: 0;">${actionLabels[action] || action}</h3>
                        <p><strong>Usuário:</strong> ${user.full_name || user.username}</p>
                        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        ${details.produtoId ? `<p><strong>Produto ID:</strong> ${details.produtoId}</p>` : ''}
                        ${details.quantidade ? `<p><strong>Quantidade:</strong> ${details.quantidade}</p>` : ''}
                        ${details.motivo ? `<p><strong>Motivo:</strong> ${details.motivo}</p>` : ''}
                    </div>
                    <p style="color: #7f8c8d; font-size: 12px;">
                        Esta é uma notificação automática do sistema StockCtrl.
                    </p>
                </div>
            `
        };

        return await sendEmail(mailOptions);
    }

    static async getActivityLogs(empresa_id, limit = 100, offset = 0) {
        try {
            const query = `
                SELECT 
                    al.*,
                    p.nome as product_name,
                    u.username as user_username
                FROM activity_logs al
                LEFT JOIN products p ON al.product_id = p.id
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.empresa_id = ?
                ORDER BY al.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            const [logs] = await pool.query(query, [empresa_id, limit, offset]);
            return logs;
        } catch (error) {
            console.error('❌ Erro ao buscar logs:', error.message);
            return [];
        }
    }
}

module.exports = ActivityLogger; 