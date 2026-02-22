CREATE TABLE record_versions (
    id SERIAL PRIMARY KEY,
    record_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT NOT NULL,
    version INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_record FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE RESTRICT
);

CREATE INDEX idx_record_versions_record_id ON record_versions(record_id);