-- PetMatch Home Score — Sample Seed Data
-- IMPORTANT: Replace 'YOUR_USER_UUID' with your actual user ID after signing up.
-- You can find it in Authentication > Users in your Supabase dashboard.

-- Sample Property 1: Suburban home with yard
insert into public.properties (
  id, user_id, address, city, state, postal_code, latitude, longitude,
  listing_description, beds, baths, sqft, lot_size, property_type,
  stories, flooring_type, fencing_type,
  has_mudroom, has_pet_door, has_pet_wash_station, has_screened_porch, has_pool,
  has_built_in_pet_features, built_in_pet_features_desc,
  hoa_has_restrictions, notes
) values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'YOUR_USER_UUID',
  '742 Evergreen Terrace', 'Springfield', 'IL', '62704',
  39.7817, -89.6501,
  'Charming 3-bedroom ranch on a quiet cul-de-sac. Spacious fenced backyard with mature shade trees. Single-story layout with hardwood floors throughout. Sunroom off the kitchen overlooks the garden. Two-car garage. Walking distance to Centennial Park and local trails.',
  3, 2.0, 1850, '0.35 acres', 'single_family',
  1, 'hardwood', 'wood_privacy',
  true, false, false, true, false,
  true, 'Built-in dog feeding station in mudroom',
  false,
  'Great neighborhood. Seller has two dogs and says the yard is escape-proof.'
);

-- Sample Property 2: Downtown condo
insert into public.properties (
  id, user_id, address, city, state, postal_code, latitude, longitude,
  listing_description, beds, baths, sqft, lot_size, property_type,
  stories, flooring_type, fencing_type,
  has_mudroom, has_pet_door, has_pet_wash_station, has_screened_porch, has_pool,
  has_built_in_pet_features,
  hoa_has_restrictions, hoa_pet_policy, hoa_pet_limit, notes
) values (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'YOUR_USER_UUID',
  '200 Lake Shore Drive, Unit 14C', 'Chicago', 'IL', '60601',
  41.8862, -87.6186,
  'Modern 2-bed, 2-bath condo on the 14th floor with floor-to-ceiling windows and stunning lake views. Open concept living with quartz counters and stainless appliances. Building has rooftop dog run and is steps from Millennium Park. Heated garage parking included.',
  2, 2.0, 1100, 'N/A', 'condo',
  1, 'tile', 'none',
  false, false, false, false, false,
  false,
  true, 'Max 2 pets, monthly pet deposit required', 2,
  'Building allows up to 2 pets. Monthly pet deposit required.'
);

-- Pet profiles for Property 1
insert into public.pet_profiles (id, property_id, user_id, name, species, breed, age_category, size_category, activity_level, indoor_outdoor, mobility_limitations, anxiety_sensitivity, escape_risk, special_notes)
values
(
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'YOUR_USER_UUID',
  'Buddy', 'dog', 'Golden Retriever', 'senior', 'large', 'low',
  'both', 'Hip dysplasia — needs single-story or minimal stairs',
  'moderate', 'low',
  'Loves sunbathing. Needs soft surfaces for resting.'
),
(
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'YOUR_USER_UUID',
  'Whiskers', 'cat', 'Maine Coon', 'adult', 'large', 'moderate',
  'indoor', null, 'high', 'low',
  'Needs window perches and vertical space. Startles at loud noises.'
);

-- Pet profile for Property 2
insert into public.pet_profiles (id, property_id, user_id, name, species, breed, age_category, size_category, activity_level, indoor_outdoor, anxiety_sensitivity, escape_risk, special_notes)
values (
  'e5f6a7b8-c9d0-1234-efab-345678901234',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'YOUR_USER_UUID',
  'Scout', 'dog', 'Border Collie', 'young', 'medium', 'very_high',
  'both', 'low', 'high',
  'Extremely energetic. Needs daily runs and mental stimulation. Known fence jumper.'
);

-- Analysis for Property 1
insert into public.analyses (
  id, property_id, user_id, overall_score,
  traffic_safety_score, yard_score, senior_comfort_score, exercise_score, indoor_comfort_score, noise_stress_score,
  red_flags_json, highlights_json, ai_summary, agent_notes, scoring_details_json,
  species_insights_json, marketing_tips_json, upgrade_suggestions_json
) values (
  'f6a7b8c9-d0e1-2345-fabc-456789012345',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'YOUR_USER_UUID',
  82,
  85, 92, 88, 70, 80, 75,
  '["Moderate traffic on adjacent street during rush hour", "No nearby emergency vet within 5 miles"]'::jsonb,
  '["Fully fenced backyard with mature shade trees", "Single-story layout ideal for senior dog with hip dysplasia", "Sunroom provides excellent window-watching for indoor cat", "Walking distance to Centennial Park", "Quiet cul-de-sac location"]'::jsonb,
  'This home is an excellent match for Buddy and Whiskers. The single-story ranch layout eliminates stair concerns for Buddy''s hip dysplasia, and the spacious fenced backyard gives him safe outdoor access with plenty of shade for resting. Whiskers will love the sunroom — it provides the warm, light-filled perch space that indoor cats thrive in, with views of the garden.',
  'Lead with the sunroom and fenced yard during showing. Mention the single-story layout as a pet wellness feature.',
  '{"traffic_safety": {"score": 85, "reasoning": "Cul-de-sac location significantly reduces traffic risk."}, "yard": {"score": 92, "reasoning": "Fenced 0.35-acre lot with mature trees. Seller confirms escape-proof."}, "senior_comfort": {"score": 88, "reasoning": "Single-story eliminates all stair barriers. Hardwood floors are easy to navigate."}, "exercise": {"score": 70, "reasoning": "Park within walking distance. Yard adequate for gentle play."}, "indoor_comfort": {"score": 80, "reasoning": "Good natural light via sunroom. Open layout."}, "noise_stress": {"score": 75, "reasoning": "Generally quiet cul-de-sac. Some traffic noise possible."}}'::jsonb,
  '{"dog": {"strengths": ["Fully fenced backyard for safe off-leash time", "Single-story eliminates stair risk for hip dysplasia", "Mudroom for post-walk cleanup"], "concerns": ["No nearby emergency vet"], "must_haves_met": ["Fenced yard", "Single-story access", "Shade and resting areas"], "must_haves_missing": [], "dealbreaker_risk": "low"}, "cat": {"strengths": ["Sunroom with garden views for window watching", "Quiet cul-de-sac reduces noise stress", "Screened porch for safe outdoor exposure"], "concerns": ["Hardwood floors may be slippery for older cats"], "must_haves_met": ["Indoor-safe layout", "Natural light", "Quiet environment"], "must_haves_missing": ["Vertical climbing spaces"], "dealbreaker_risk": "low"}}'::jsonb,
  '["Highlight the sunroom as a ''cat paradise'' in listing photos", "Feature the fenced backyard with ''escape-proof'' in pet-owner marketing", "Mention walking distance to Centennial Park for dog owners", "Position the single-story as a pet wellness feature"]'::jsonb,
  '[{"name": "Install cat shelving in sunroom", "impact": "medium", "description": "Wall-mounted shelves and perches for vertical climbing", "estimated_cost": "$200-400"}, {"name": "Add pet door to back entrance", "impact": "high", "description": "Allows dogs independent yard access", "estimated_cost": "$150-300"}, {"name": "Upgrade to slip-resistant floor treatment", "impact": "medium", "description": "Reduces fall risk for senior pets on hardwood", "estimated_cost": "$300-600"}]'::jsonb
);

-- Analysis for Property 2
insert into public.analyses (
  id, property_id, user_id, overall_score,
  traffic_safety_score, yard_score, senior_comfort_score, exercise_score, indoor_comfort_score, noise_stress_score,
  red_flags_json, highlights_json, ai_summary, agent_notes, scoring_details_json,
  species_insights_json, marketing_tips_json, upgrade_suggestions_json
) values (
  'a7b8c9d0-e1f2-3456-abcd-567890123456',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'YOUR_USER_UUID',
  48,
  55, 20, 60, 65, 70, 35,
  '["No private yard — relies on building dog run only", "14th floor balcony is an escape/fall risk for high-escape dog", "Lake Shore Drive generates significant traffic noise", "High-energy breed in 1100 sqft may lead to destructive behavior"]'::jsonb,
  '["Millennium Park nearby for daily exercise", "Building has dedicated rooftop dog run", "Floor-to-ceiling windows provide excellent natural light", "Heated garage means no cold weather leash-up in winter"]'::jsonb,
  'This condo presents significant challenges for Scout. While the building offers pet-friendly amenities like a rooftop dog run and proximity to Millennium Park, the 1100 sqft space is quite small for a very high-energy Border Collie.',
  'This is a tough match. If the buyer is set on downtown living with Scout, emphasize the park access and dog run as non-negotiable daily routines.',
  '{"traffic_safety": {"score": 55, "reasoning": "Lake Shore Drive is a major arterial road."}, "yard": {"score": 20, "reasoning": "No private outdoor space. Rooftop dog run is shared and small."}, "senior_comfort": {"score": 60, "reasoning": "N/A for this young dog. Elevator access is adequate."}, "exercise": {"score": 65, "reasoning": "Millennium Park is excellent but requires leash walks on busy streets."}, "indoor_comfort": {"score": 70, "reasoning": "Great natural light. But 1100 sqft is small for this breed."}, "noise_stress": {"score": 35, "reasoning": "Lake Shore Drive traffic is audible. Urban noise constant."}}'::jsonb,
  '{"dog": {"strengths": ["Rooftop dog run in building", "Steps from Millennium Park", "Heated garage for winter walks"], "concerns": ["Only 1100 sqft for high-energy breed", "14th floor balcony escape risk", "Constant urban noise"], "must_haves_met": ["Nearby park access", "Pet-friendly building"], "must_haves_missing": ["Private yard", "Quiet environment", "Adequate indoor space for energy level"], "dealbreaker_risk": "high"}}'::jsonb,
  '["Mention rooftop dog run as a key amenity", "Highlight proximity to Millennium Park for active dog owners", "Note heated garage as a winter convenience for pet owners"]'::jsonb,
  '[{"name": "Balcony safety netting", "impact": "high", "description": "Prevents escape/fall risk for dogs on 14th floor balcony", "estimated_cost": "$200-500"}, {"name": "Sound-dampening window treatments", "impact": "medium", "description": "Reduces Lake Shore Drive traffic noise", "estimated_cost": "$500-1000"}]'::jsonb
);
