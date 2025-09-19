-- Add Delivery shipping provider
-- This script adds the Delivery shipping provider to the shipping_providers table

INSERT INTO shipping_providers (name, code, api_endpoint, supported_countries, is_active) VALUES
('Delivery', 'delivery', 'https://api.delivery.com/v1/', '{1,2,3}', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  api_endpoint = EXCLUDED.api_endpoint,
  supported_countries = EXCLUDED.supported_countries,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the insertion
SELECT * FROM shipping_providers WHERE code = 'delivery';