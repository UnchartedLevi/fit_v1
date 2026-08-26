-- Normalize option-based products so Premium and Standard are options, not sizes.
update public.product_variants
set size = null,
    option_values = jsonb_build_object('option', case when upper(sku) like '%PREMIUM%' then 'Premium' else 'Standard' end)
where sku in ('BUMPA-GRIP-SOCKS-PREMIUM', 'BUMPA-GRIP-SOCKS-STANDARD', 'BUMPA-JUMP-ROPE-PREMIUM', 'BUMPA-JUMP-ROPE-STANDARD');

update public.product_variants
set price_override = case
  when sku = 'BUMPA-GRIP-SOCKS-STANDARD' then 5500
  when sku = 'BUMPA-GRIP-SOCKS-PREMIUM' then 6500
  when sku = 'BUMPA-JUMP-ROPE-STANDARD' then 7500
  when sku = 'BUMPA-JUMP-ROPE-PREMIUM' then 9500
  else price_override
end
where sku in ('BUMPA-GRIP-SOCKS-PREMIUM', 'BUMPA-GRIP-SOCKS-STANDARD', 'BUMPA-JUMP-ROPE-PREMIUM', 'BUMPA-JUMP-ROPE-STANDARD');
