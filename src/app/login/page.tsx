
"use client";

import React, { useState } from 'react';
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
import { Command, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Cuenta creada", description: "Bienvenido a Vectra Hub." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Acceso concedido", description: "Sesión iniciada correctamente." });
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error de autenticación", 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Acceso Google", description: "Sesión iniciada correctamente." });
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Este dominio no está autorizado en la consola de Firebase. Añádelo en Auth > Settings > Authorized domains.";
      }
      toast({ 
        variant: "destructive", 
        title: "Error de Google", 
        description: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-body">
      <Card className="w-full max-w-md shadow-2xl border-slate-200/60 rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="space-y-4 text-center pb-8 pt-10">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <Command className="w-10 h-10" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-headline font-bold text-slate-900">Vectra Hub</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {isRegistering ? 'Crea una nueva cuenta de operador' : 'Ingresa al centro de mando logístico'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@vectra.com" 
                  className="pl-10 rounded-xl bg-slate-50 border-slate-200 focus:ring-1 focus:ring-primary h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 rounded-xl bg-slate-50 border-slate-200 focus:ring-1 focus:ring-primary h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  PROCESANDO...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isRegistering ? 'REGISTRAR OPERADOR' : 'INICIAR SESIÓN'}
                </span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold">
              <span className="bg-white px-4 text-slate-400">O accede con</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl border-slate-200 font-bold flex items-center gap-3 hover:bg-slate-50"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            GOOGLE AUTH
          </Button>
        </CardContent>
        <CardFooter className="pb-8 flex justify-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs font-bold text-primary hover:underline"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nuevo operador? Crea una cuenta'}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
