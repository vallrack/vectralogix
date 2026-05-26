
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Command, Mail, Lock, LogIn, UserPlus, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentHostname, setCurrentHostname] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHostname(window.location.hostname);
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    toast({ title: "Copiado", description: "Dominio copiado al portapapeles." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Cuenta creada", description: "Bienvenido a Vectra Hub. Tu acceso ha sido registrado." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Acceso concedido", description: "Sincronización de credenciales exitosa." });
      }
      router.push('/dashboard');
    } catch (error: any) {
      // No logueamos el error a console.error para evitar el overlay de Next.js
      let errorMessage = error.message;
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = `unauthorized-domain:${currentHostname}`;
      }
      setAuthError(errorMessage);
      toast({ 
        variant: "destructive", 
        title: "Fallo de Autenticación", 
        description: error.code || "Error al procesar la solicitud." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Google Auth Exitosa", description: "Sesión iniciada correctamente." });
      router.push('/dashboard');
    } catch (error: any) {
      // No logueamos el error a console.error para evitar el overlay de Next.js
      let errorMessage = "No se pudo completar la autenticación con Google.";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = `unauthorized-domain:${currentHostname}`;
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "El proveedor de Google no está habilitado en Firebase Console.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "La ventana de autenticación fue cerrada.";
      }
      
      setAuthError(errorMessage);
      toast({ 
        variant: "destructive", 
        title: "Error de Autenticación", 
        description: error.code || errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-body">
      <Card className="w-full max-w-md shadow-2xl border-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="space-y-4 text-center pb-8 pt-12">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/30 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <Command className="w-12 h-12" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold text-slate-900 tracking-tight">VECTRA HUB</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {isRegistering ? 'Registrar nuevo operador táctico' : 'Ingreso al centro de mando logístico'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {authError && authError.startsWith('unauthorized-domain') ? (
            <Alert variant="destructive" className="rounded-2xl bg-rose-50 border-rose-100 text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div className="flex flex-col gap-2">
                <AlertTitle className="text-xs font-bold uppercase tracking-wider">Dominio No Autorizado</AlertTitle>
                <AlertDescription className="text-[11px] leading-relaxed">
                  Copia el dominio abajo y agrégalo a los "Dominios autorizados" en tu consola de Firebase.
                </AlertDescription>
                <div className="mt-1 p-2 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-2 shadow-sm">
                  <code className="text-[10px] font-mono text-slate-600 truncate flex-1">{currentHostname}</code>
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-primary"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <a 
                  href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/settings`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center justify-center gap-2 py-2 px-4 bg-primary text-white text-[10px] font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md"
                >
                  ABRIR CONFIGURACIÓN DE FIREBASE <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Alert>
          ) : authError && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="text-[11px]">{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Terminal de Acceso (Email)</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="operador@vectralogix.com" 
                  className="pl-12 rounded-2xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-primary/20 h-14 text-sm font-medium transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clave Operativa</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-12 rounded-2xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-primary/20 h-14 text-sm transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-primary font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-white text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  PROCESANDO...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isRegistering ? 'REGISTRAR OPERADOR' : 'INICIAR SESIÓN'}
                </span>
              )}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-white px-4 text-slate-400">Validación Externa</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl border-slate-200 font-bold flex items-center gap-4 hover:bg-slate-50 transition-colors text-slate-700"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            AUTENTICACIÓN GOOGLE
          </Button>
        </CardContent>
        <CardFooter className="pb-10 flex justify-center">
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setAuthError(null);
            }}
            className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-all uppercase tracking-widest"
          >
            {isRegistering ? '¿Ya eres operador? Inicia sesión' : '¿Nuevo acceso? Solicitar cuenta'}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
