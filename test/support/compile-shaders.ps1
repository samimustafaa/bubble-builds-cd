param([Parameter(Mandatory=$true)][string]$Folder, [int]$ExpectedCount=78)
$ErrorActionPreference='Stop'
Add-Type @'
using System;
using System.Runtime.InteropServices;
[ComImport, Guid("8BA5FB08-5195-40E2-AC58-0D989C3A0102"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface ShaderBlob {
 [PreserveSig] IntPtr GetBufferPointer();
 [PreserveSig] UIntPtr GetBufferSize();
}
public static class ShaderCompiler {
 [DllImport("d3dcompiler_47.dll", CallingConvention=CallingConvention.StdCall)]
 public static extern int D3DCompile(byte[] source, UIntPtr length, string name, IntPtr defines, IntPtr include, string entry, string target, uint flags, uint effectFlags, out ShaderBlob code, out ShaderBlob errors);
 public static void Check(string file) {
  byte[] source=System.IO.File.ReadAllBytes(file);
  ShaderBlob code=null, errors=null;
  try {
   int result=D3DCompile(source,new UIntPtr((uint)source.Length),file,IntPtr.Zero,IntPtr.Zero,"ps_main","ps_3_0",0,0,out code,out errors);
   if(result<0) {
    string message=errors==null?"No compiler diagnostic":Marshal.PtrToStringAnsi(errors.GetBufferPointer(),(int)errors.GetBufferSize().ToUInt64());
    throw new Exception(System.IO.Path.GetFileName(file)+": "+message);
   }
  } finally {
   if(code!=null)Marshal.ReleaseComObject(code);
   if(errors!=null)Marshal.ReleaseComObject(errors);
  }
 }
}
'@
$files=Get-ChildItem -LiteralPath $Folder -Filter '*.hlsl'
if($files.Count -ne $ExpectedCount){throw 'Shader fixtures are missing.'}
foreach($file in $files){[ShaderCompiler]::Check($file.FullName)}
Write-Output "Compiled $($files.Count) authored surface shader fixtures for Direct3D 9."
