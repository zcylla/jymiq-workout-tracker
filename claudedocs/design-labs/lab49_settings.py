"""Lab 49 panel — Settings with one line per row.

Owner rule: a settings row is label left, value right, chevron if it navigates.
No helper text under it. What a switch does is said by the switch; what a value
is is said by the value. Import COLS into the Lab 49 page, or run this file to
write a standalone preview.

Rows marked (board) are drawn on Lab 37 D4 but not built yet: nothing in the app
consumes a distance, a language, plate maths or warm-up ramps.
"""
import kit as K


def srow(label, value='', chev=True, tone='var(--hi)', dot=None):
    """One line: name, then a mono value, then a chevron only if it navigates."""
    d = ('<span style="width:8px;height:8px;border-radius:9999px;flex:none;margin-right:8px;'
         'background:' + dot + '"></span>') if dot else ''
    v = ('<span class="mono" style="font-size:13px;color:var(--mid);margin-right:10px">'
         + value + '</span>') if value else ''
    return K.lrow('<span style="font-size:15px;color:' + tone + '">' + label + '</span>',
                  d + v, chev=chev)


def stoggle(label, on):
    """One line: name, then the switch. The switch is the whole answer."""
    knob = ('<div style="width:44px;height:26px;border-radius:9999px;flex:none;padding:3px;'
            'display:flex;justify-content:' + ('flex-end' if on else 'flex-start')
            + ';background:' + ('var(--accent)' if on else 'rgba(255,255,255,0.10)') + '">'
            '<span style="width:20px;height:20px;border-radius:9999px;background:'
            + ('#15130f' if on else 'var(--lo)') + '"></span></div>')
    return ('<div class="lrow"><span style="font-size:15px;color:var(--hi)">' + label
            + '</span><span class="sp"></span>' + knob + '</div>')


PLATES = [('25', '#c0392b'), ('20', '#2d6cb5'), ('15', '#d9a92b'), ('10', '#3f8f4f'),
          ('5', '#e8e6e1'), ('2.5', '#b3312a'), ('1.25', '#c9c8c4')]

SWATCHES = (
    '<div class="r" style="gap:6px;padding:4px 0 10px;align-items:flex-end">' + ''.join(
        '<span style="width:13px;height:' + str(int(20 + 26 * i / 6)) + 'px;border-radius:2px;'
        'background:' + c + '"></span>'
        for i, (w, c) in enumerate(reversed(PLATES))) + '</div>')

SETTINGS = K.phone(
    K.back_head('Settings')
    + K.psec('UNITS', K.prows([
        srow('Weight', 'KG', chev=False),
        srow('Distance', 'CM'),
        srow('Language', 'EN')]), first=True, plated=False)
    + K.psec('TRAINING', K.prows([
        stoggle('Track RPE', False),
        srow('Rest &middot; compound', '3:00'),
        srow('Rest &middot; isolation', '1:30'),
        stoggle('Warm-up ramps', True),
        stoggle('Tap opens keypad', False)]), plated=False)
    + K.psec('PLATES', SWATCHES + K.prows([
        srow('Colours', 'COMPETITION'),
        stoggle('Plate maths', True)]), plated=False)
    + K.psec('ACCOUNT', K.prows([
        srow('Account', '', dot=K.DONE),
        srow('Back up now', '5 MIN', chev=False, dot=K.DONE),
        srow('Restore from cloud', '', tone='var(--live)'),
        srow('Export everything', '')]), plated=False),
    chrome='')

GRAMMAR = K.phone(
    K.back_head('Row grammar')
    + K.psec('FOUR ROWS, ONE LINE EACH', K.prows([
        srow('Weight', 'KG', chev=False),
        srow('Rest &middot; compound', '3:00'),
        stoggle('Track RPE', True),
        srow('Restore from cloud', '', tone='var(--live)')]), first=True, plated=False)
    + K.psec('WHAT EACH SAYS', K.para(
        '<b style="color:#c9c3b6;font-weight:500">Value, no chevron:</b> taps in place. '
        '<b style="color:#c9c3b6;font-weight:500">Value and chevron:</b> opens a picker or a screen. '
        '<b style="color:#c9c3b6;font-weight:500">Switch:</b> the position is the answer. '
        '<b style="color:#c9c3b6;font-weight:500">Red name:</b> destroys data; the confirm dialog '
        'carries the words.'), plated=False),
    chrome='')

COLS = [
 ('E1', 'Settings, one line', 'Label left, value right, chevron if it navigates',
  'Every row is 44pt, one line, and has no helper text. Units, distance, language, plate colours '
  'and plate maths, warm-up ramps, account and backup. Backup status is a dot and a relative '
  'time, not a sentence.',
  '<b>The meta line is where the explaining lived</b>, and every one of them either restated the '
  'switch state (&ldquo;ON &mdash; LOGS UNSET UNLESS YOU DIAL IT&rdquo;) or described the '
  'implementation (&ldquo;KILOGRAMS ARE ALWAYS WHAT IS STORED&rdquo;). Distance, language, colours, '
  'plate maths and warm-up ramps are drawn but not built.',
  SETTINGS),
 ('E2', 'The four rows', 'What the position of a mark already says',
  'Value with no chevron edits in place; value with a chevron opens something; a switch needs '
  'no words; a red name is the only warning a settings row carries.',
  'Position, colour and shape do the work a helper line was doing. The destructive rows keep '
  'their sentence &mdash; in the confirm dialog, once, where it can stop you.',
  GRAMMAR),
]

if __name__ == '__main__':
    open('lab49_settings.html', 'w').write(K.page(
        49, 'Settings, one line per row',
        K.para('Owner rule: no two- or three-line settings rows.'), [('', '', COLS)]))
