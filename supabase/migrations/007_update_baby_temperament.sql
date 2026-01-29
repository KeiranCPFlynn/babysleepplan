-- Update baby temperament options and add notes

alter table babies add column if not exists temperament_notes text;

alter table babies drop constraint if exists babies_temperament_check;
alter table babies add constraint babies_temperament_check
  check (temperament in (
    'easy',
    'moderate',
    'spirited',
    'sensitive',
    'adaptable',
    'slow_to_warm',
    'persistent',
    'not_sure',
    'other'
  ));
