import re,sys
def gate(path):
    b=open(path).read(); fails=[]
    def g(n,ok,d=''):
        print(f"  [{'PASS' if ok else 'FAIL'}] {n}{'  '+d if d else ''}")
        if not ok: fails.append(n)
    g("ends </html>", b.rstrip().endswith('</html>'))
    for t in ['x-dc','helmet','svg','defs','linearGradient']:
        o=len(re.findall(r'<%s[ >]'%t,b)); c=len(re.findall(r'</%s>'%t,b))
        if o or c: g(f"tags {t}", o==c, f"{o}/{c}")
    g("divs balanced", len(re.findall(r'<div[ >]',b))==len(re.findall(r'</div>',b)))
    g("spans balanced", len(re.findall(r'<span[ >]',b))==len(re.findall(r'</span>',b)))
    g("no doubled quotes", '""' not in b)
    g("no attr spans newline", not any('\n' in m.group(2) for m in re.finditer(r'\b([a-zA-Z-]+)="([^"]*)"',b)))
    sizes=[int(x) for x in re.findall(r'font-size:(\d+)px',b)]
    g("no type below 11px", not [x for x in sizes if x<11], f"min {min(sizes) if sizes else '-'}")
    print("  RESULT:", "READY" if not fails else f"BLOCKED {fails}")
    return fails
if __name__=='__main__':
    sys.exit(1 if gate(sys.argv[1]) else 0)
