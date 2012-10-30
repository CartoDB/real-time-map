#!/usr/bin/env ruby

i = 0

while(true) 

  system("curl -d \"q=INSERT INTO states_results(gov_dem_pct,gov_gop_pct,gov_oth_pct,gov_pctrpt,gov_result,invalid_the_geom,is_swing,pres_dem_pct,pres_gop_pct,pres_oth_pct,pres_pctrpt,pres_result,sen_dem_pct,sen_gop_pct,sen_oth_pct,sen_pctrpt,sen_result,usps,version) WITH last_version as (SELECT max(version) as max_version FROM states_results) SELECT gov_dem_pct,gov_gop_pct,gov_oth_pct,gov_pctrpt,#{i} as gov_result,invalid_the_geom,is_swing,pres_dem_pct,pres_gop_pct,pres_oth_pct,pres_pctrpt,pres_result,sen_dem_pct,sen_gop_pct,sen_oth_pct,sen_pctrpt,sen_result,usps, (SELECT max_version%2B1 FROM last_version) FROM states_results WHERE version = (SELECT max_version FROM last_version)&api_key=cb07c48abf5eda40ab2b66818f8b1733f4d1ce0a\" http://viz2.cartodb.com/api/v2/sql")
  puts "#{i}"

  if i == 7
    i = -1
    system("curl -d \"q=DELETE FROM states_results WHERE version < (SELECT max(version) FROM states_results) -7&api_key=cb07c48abf5eda40ab2b66818f8b1733f4d1ce0a\" http://viz2.cartodb.com/api/v2/sql")
    system("curl -d \"q=vacuum full analyze states_results&api_key=cb07c48abf5eda40ab2b66818f8b1733f4d1ce0a\" http://viz2.cartodb.com/api/v2/sql")    
  end

  i = i + 1

  sleep 7
end
