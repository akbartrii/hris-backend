import re

with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix remaining prefixes in relation field names / relation names
content = content.replace('tr_face_registrations_', 'ms_face_registrations_')
content = content.replace('tr_users_', 'ms_users_')
content = content.replace('tr_employees_', 'ms_employees_')

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content)

print('Schema prefix fixes applied.')
