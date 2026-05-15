import os
import re

# Patterns to replace in source files
replacements = [
    # Explicit relation field names (must be before general replacements)
    ('tr_employees_tr_', 'ms_employees_tr_'),
    ('Totr_employees', 'Toms_employees'),

    # Prisma client calls and property access
    ('prisma.tr_employees.', 'prisma.ms_employees.'),
    ('prisma.tr_users.', 'prisma.ms_users.'),
    ('prisma.tr_face_registrations.', 'prisma.ms_face_registrations.'),

    # Include / select shorthand and property access (word boundaries)
    # Use regex for these to avoid partial matches
]

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Explicit relation names
    content = content.replace('tr_employees_tr_', 'ms_employees_tr_')
    content = content.replace('Totr_employees', 'Toms_employees')

    # 2. Prisma client method chains
    content = content.replace('prisma.tr_employees.', 'prisma.ms_employees.')
    content = content.replace('prisma.tr_users.', 'prisma.ms_users.')
    content = content.replace('prisma.tr_face_registrations.', 'prisma.ms_face_registrations.')

    # 3. Word-boundary replacements for model references
    # tr_face_registrations -> ms_face_registrations (safe globally)
    content = re.sub(r'\btr_face_registrations\b', 'ms_face_registrations', content)

    # tr_users -> ms_users (word boundary safe; won't hit tr_user_devices)
    content = re.sub(r'\btr_users\b', 'ms_users', content)

    # tr_employees -> ms_employees (safe globally)
    content = re.sub(r'\btr_employees\b', 'ms_employees', content)

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

updated_files = []
for root, dirs, files in os.walk('src'):
    for name in files:
        if name.endswith(('.ts', '.js', '.tsx', '.jsx')):
            path = os.path.join(root, name)
            if process_file(path):
                updated_files.append(path)

# Also update scripts folder
for root, dirs, files in os.walk('scripts'):
    for name in files:
        if name.endswith(('.ts', '.js', '.tsx', '.jsx')):
            path = os.path.join(root, name)
            if process_file(path):
                updated_files.append(path)

print(f'Updated {len(updated_files)} files:')
for f in updated_files:
    print(f'  {f}')
