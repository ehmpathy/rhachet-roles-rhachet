import { RoleRegistry } from 'rhachet';

import { ROLE_ENROLLER } from '@src/domain.roles/enroller/getEnrollerRole';

/**
 * .what = returns the core registry of predefined roles and skills
 * .why =
 *   - enables CLI or thread logic to load available roles
 *   - avoids dynamic load or global mutation
 */
export const getRoleRegistry = (): RoleRegistry =>
  new RoleRegistry({
    slug: 'rhachet',
    readme: { uri: __dirname + '/readme.md' },
    roles: [ROLE_ENROLLER],
  });
