
TRUNCATE dancers RESTART IDENTITY CASCADE; 

ALTER TABLE dancers
    ADD COLUMN wrapped_key          text NOT NULL,  
    ADD COLUMN recovery_salt        text NOT NULL,
    ADD COLUMN recovery_hash        text NOT NULL,  
    ADD COLUMN recovery_wrapped_key text NOT NULL;  