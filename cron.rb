#!/usr/bin/env ruby

i = 0

while(true) 

  system("curl -d \"q=UPDATE states_results SET gov_result = #{i}&api_key=cb07c48abf5eda40ab2b66818f8b1733f4d1ce0a\" http://viz2.cartodb.com/api/v2/sql")
  puts "#{i}"

  i = i + 1

  i = 0 if i == 7

  sleep 5
end
