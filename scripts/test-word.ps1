try {
  $word = New-Object -ComObject Word.Application
  $word.Quit()
  Write-Output 'WORD_OK'
} catch {
  Write-Output "WORD_FAIL: $($_.Exception.Message)"
}
