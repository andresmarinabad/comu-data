export const schema = {
  persons: [['id','uuid'],['first_name','text'],['last_name','text'],['birth_date','date'],['address','text'],['phone','text'],['email','text'],['spouse_id','uuid'],['parent_id','uuid'],['sex','character'],['created_at','timestamp with time zone'],['updated_at','timestamp with time zone']],
  services: [['id','uuid'],['name','text'],['description','text'],['created_at','timestamp with time zone'],['updated_at','timestamp with time zone']],
  person_services: [['person_id','uuid'],['service_id','uuid'],['created_at','timestamp with time zone']],
  events: [['id','uuid'],['name','text'],['description','text'],['starts_at','timestamp with time zone'],['location','text'],['created_at','timestamp with time zone'],['updated_at','timestamp with time zone']],
  groups: [['id','uuid'],['name','text'],['created_at','timestamp with time zone'],['updated_at','timestamp with time zone']],
  group_members: [['group_id','uuid'],['person_id','uuid'],['created_at','timestamp with time zone']],
  traditio: [['id','uuid'],['person_1_id','uuid'],['person_2_id','uuid'],['person_3_id','uuid'],['text','text'],['created_at','timestamp with time zone'],['updated_at','timestamp with time zone']],
  words: [['id','uuid'],['word','text'],['created_at','timestamp with time zone']],
  current_psalm: [['id','uuid'],['psalm_number','integer'],['updated_at','timestamp with time zone']],
  agapes: [['id','uuid'],['event_id','uuid'],['created_at','timestamp with time zone'],['updated_at','timestamp with time zone']],
  agape_food_types: [['id','uuid'],['name','text'],['created_at','timestamp with time zone']],
  agape_assignments: [['id','uuid'],['agape_id','uuid'],['person_id','uuid'],['food_type_id','uuid'],['created_at','timestamp with time zone']],
}

export const tableNames = Object.keys(schema)
export const primaryKeys = { person_services: ['person_id','service_id'], group_members: ['group_id','person_id'] }
