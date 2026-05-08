-- PetMatch Home Score — Sample Seed Data
-- IMPORTANT: Replace 'YOUR_USER_UUID' with your actual user ID after signing up.
-- You can find it in Authentication > Users in your Supabase dashboard.

-- Sample Property 1: Suburban home with yard
insert into public.properties (id, user_id, address, city, state, postal_code, latitude, longitude, listing_description, beds, baths, sqft, lot_size, property_type, notes)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'YOUR_USER_UUID',
  '742 Evergreen Terrace',
  'Springfield',
  'IL',
  '62704',
  39.7817,
  -89.6501,
  'Charming 3-bedroom ranch on a quiet cul-de-sac. Spacious fenced backyard with mature shade trees. Single-story layout with hardwood floors throughout. Sunroom off the kitchen overlooks the garden. Two-car garage. Walking distance to Centennial Park and local trails.',
  3, 2.0, 1850, '0.35 acres', 'single_family',
  'Great neighborhood. Seller has two dogs and says the yard is escape-proof.'
);

-- Sample Property 2: Downtown condo
insert into public.properties (id, user_id, address, city, state, postal_code, latitude, longitude, listing_description, beds, baths, sqft, lot_size, property_type, notes)
values (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'YOUR_USER_UUID',
  '200 Lake Shore Drive, Unit 14C',
  'Chicago',
  'IL',
  '60601',
  41.8862,
  -87.6186,
  'Modern 2-bed, 2-bath condo on the 14th floor with floor-to-ceiling windows and stunning lake views. Open concept living with quartz counters and stainless appliances. Building has rooftop dog run and is steps from Millennium Park. Heated garage parking included.',
  2, 2.0, 1100, 'N/A', 'condo',
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
insert into public.analyses (id, property_id, user_id, overall_score, traffic_safety_score, yard_score, senior_comfort_score, exercise_score, indoor_comfort_score, noise_stress_score, red_flags_json, highlights_json, ai_summary, agent_notes, scoring_details_json)
values (
  'f6a7b8c9-d0e1-2345-fabc-456789012345',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'YOUR_USER_UUID',
  82,
  85, 92, 88, 70, 80, 75,
  '["Moderate traffic on adjacent street during rush hour", "No nearby emergency vet within 5 miles"]'::jsonb,
  '["Fully fenced backyard with mature shade trees", "Single-story layout ideal for senior dog with hip dysplasia", "Sunroom provides excellent window-watching for indoor cat", "Walking distance to Centennial Park", "Quiet cul-de-sac location"]'::jsonb,
  'This home is an excellent match for Buddy and Whiskers. The single-story ranch layout eliminates stair concerns for Buddy''s hip dysplasia, and the spacious fenced backyard gives him safe outdoor access with plenty of shade for resting. Whiskers will love the sunroom — it provides the warm, light-filled perch space that indoor cats thrive in, with views of the garden. The cul-de-sac location keeps traffic noise low, which is important given Whiskers'' noise sensitivity. The nearby park offers gentle walking options for Buddy''s moderate exercise needs.',
  'Lead with the sunroom and fenced yard during showing. Mention the single-story layout as a pet wellness feature. The seller''s note about escape-proof fencing is a strong selling point for the buyer''s peace of mind.',
  '{"traffic_safety": {"score": 85, "reasoning": "Cul-de-sac location significantly reduces traffic risk. Adjacent street has moderate rush-hour volume but is not a through-road."}, "yard": {"score": 92, "reasoning": "Fenced 0.35-acre lot with mature trees. Seller confirms escape-proof. Excellent for both supervised and unsupervised outdoor time."}, "senior_comfort": {"score": 88, "reasoning": "Single-story eliminates all stair barriers. Hardwood floors are easy to navigate. Sunroom provides warm resting spot."}, "exercise": {"score": 70, "reasoning": "Park within walking distance. Yard adequate for gentle play. Limited trail access for more active needs."}, "indoor_comfort": {"score": 80, "reasoning": "Good natural light via sunroom. Hardwood floors. Open layout. Could benefit from more vertical space for cat."}, "noise_stress": {"score": 75, "reasoning": "Generally quiet cul-de-sac. Some traffic noise possible from adjacent road. No highway proximity."}}'::jsonb
);

-- Analysis for Property 2
insert into public.analyses (id, property_id, user_id, overall_score, traffic_safety_score, yard_score, senior_comfort_score, exercise_score, indoor_comfort_score, noise_stress_score, red_flags_json, highlights_json, ai_summary, agent_notes, scoring_details_json)
values (
  'a7b8c9d0-e1f2-3456-abcd-567890123456',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'YOUR_USER_UUID',
  48,
  55, 20, 60, 65, 70, 35,
  '["No private yard — relies on building dog run only", "14th floor with balcony is an escape/fall risk for high-escape dog", "Lake Shore Drive generates significant traffic noise", "High-energy breed in 1100 sqft may lead to destructive behavior", "Building pet deposit adds ongoing cost"]'::jsonb,
  '["Millennium Park nearby for daily exercise", "Building has dedicated rooftop dog run", "Floor-to-ceiling windows provide excellent natural light", "Heated garage means no cold weather leash-up in winter"]'::jsonb,
  'This condo presents significant challenges for Scout. While the building offers pet-friendly amenities like a rooftop dog run and proximity to Millennium Park, the 1100 sqft space is quite small for a very high-energy Border Collie. The 14th-floor location combined with Scout''s known escape tendencies creates a safety concern with the balcony. Lake Shore Drive traffic generates constant noise. Scout would need multiple daily park visits and structured mental stimulation to compensate for the limited indoor space.',
  'This is a tough match. If the buyer is set on downtown living with Scout, emphasize the park access and dog run as non-negotiable daily routines. Recommend asking about balcony enclosure options. A ground-floor unit in this building would score significantly higher.',
  '{"traffic_safety": {"score": 55, "reasoning": "Lake Shore Drive is a major arterial road. Building entrance requires crossing busy intersections. Indoor location provides some buffer."}, "yard": {"score": 20, "reasoning": "No private outdoor space. Rooftop dog run is shared and small. For a high-energy breed, this is insufficient as primary outdoor access."}, "senior_comfort": {"score": 60, "reasoning": "N/A for this young dog, but elevator access and smooth floors are adequate. Scored as neutral."}, "exercise": {"score": 65, "reasoning": "Millennium Park is excellent for runs and play. However, requires leash walks on busy streets to reach it. No off-leash options nearby."}, "indoor_comfort": {"score": 70, "reasoning": "Great natural light from windows. Modern finishes. But 1100 sqft is small for this breed''s energy level."}, "noise_stress": {"score": 35, "reasoning": "Lake Shore Drive traffic is audible. Urban noise from street level. 14th floor reduces some ground-level noise but wind noise is a factor."}}'::jsonb
);
