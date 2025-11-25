-- Create security_logs table
CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'info',
    created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for common queries
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_created_time ON security_logs(created_time DESC);
CREATE INDEX idx_security_logs_user_created ON security_logs(user_id, created_time DESC);
CREATE INDEX idx_security_logs_severity ON security_logs(severity) WHERE severity IN ('warning', 'critical');
