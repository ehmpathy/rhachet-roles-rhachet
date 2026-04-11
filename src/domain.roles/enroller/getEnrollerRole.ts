import { Role } from 'rhachet';

/**
 * .what = enroller role definition
 * .why = enables role creation and scaffold for rhachet role registries
 */
export const ROLE_ENROLLER: Role = Role.build({
  slug: 'enroller',
  name: 'Enroller',
  purpose: 'create and scaffold new roles',
  readme: { uri: __dirname + '/readme.md' },
  boot: { uri: __dirname + '/boot.yml' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
  hooks: {
    onBrain: {
      onBoot: [
        {
          command:
            './node_modules/.bin/rhachet roles boot --repo rhachet --role enroller',
          timeout: 'PT60S',
        },
      ],
    },
  },
});
