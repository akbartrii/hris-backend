import os
import re

replacements = [
    ('tr_face_registrations', 'ms_face_registrations'),
    # For tr_users, use word boundary to avoid tr_user_devices
    (r'\btr_users\b', 'ms_users'),
    (r'\btr_employees\b', 'ms_employees'),
]

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = re.sub(old, new, content)
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

paths = [
    'database/01_schema.sql',
    'database/02_triggers.sql',
    'database/03_views.sql',
    'database/04_seed_master.sql',
    'database/05_seed_dummy.sql',
    'docs/seed-users-all-roles.sql',
    'migration_check.sql',
    'migration_add_category.sql',
    'prisma/seed-reimbursements.sql',
    'scripts/add-face-descriptor-column.ts',
]

for p in paths:
    if os.path.exists(p):
        if process_file(p):
            print(f'Updated {p}')
        else:
            print(f'No changes {p}')
    else:
        print(f'Missing {p}')

# Also walk dist/ to update compiled JS (optional, will be rebuilt)
for root, dirs, files in os.walk('dist'):
    for name in files:
        if name.endswith('.js'):
            path = os.path.join(root, name)
            if process_file(path):
                print(f'Updated {path}')

print('Done.')
