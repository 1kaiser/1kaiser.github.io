describe('Window Switching', function() {
  it('should show window 1 and hide window 2 by default', function() {
    expect(window1.style.display).to.equal('block');
    expect(window2.style.display).to.equal('none');
  });

  it('should show window 2 and hide window 1 when window 2 button is clicked', function() {
    window2Btn.click();
    expect(window1.style.display).to.equal('none');
    expect(window2.style.display).to.equal('block');
  });

  it('should show window 1 and hide window 2 when window 1 button is clicked', function() {
    window1Btn.click();
    expect(window1.style.display).to.equal('block');
    expect(window2.style.display).to.equal('none');
  });
});
