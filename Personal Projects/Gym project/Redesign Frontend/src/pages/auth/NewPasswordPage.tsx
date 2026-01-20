import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Box,
  Heading,
  Field,
  Input,
  VStack,
  Container,
  Card,
  Text,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/services/api/auth';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/utils/toast';
import { ModernButton } from '@/components/ui/ModernButton';

const newPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

export default function NewPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    document.title = 'Set New Password • PayZhe';

    if (!token) {
      toast.create({
        title: 'Error',
        description: 'Invalid reset token',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/sign-in', { replace: true });
    }
  }, [token, navigate, toast]);

  const onSubmit = async (data: NewPasswordFormData) => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword({
        newPassword: data.password,
        token,
      });

      if (response.status === 'SUCCESS') {
        toast.create({
          title: 'Success',
          description: 'Password reset successfully. Please sign in with your new password.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/sign-in', { replace: true });
      } else {
        toast.create({
          title: 'Error',
          description: response.message || 'Failed to reset password',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast.create({
        title: 'Error',
        description: getErrorMessage(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <Container maxW={{ base: 'md', lg: 'lg' }} py={{ base: 6, md: 8 }} px={{ base: 4, md: 6 }}>
      <Card.Root>
        <Card.Body>
          <VStack gap={{ base: 4, md: 5, lg: 6 }} align="stretch">
            <Box textAlign="center">
              <Heading size={{ base: 'md', md: 'lg' }} mb={{ base: 1, md: 2 }}>
                Set New Password
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Enter your new password below.
              </Text>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack gap={{ base: 3, md: 4 }} align="stretch">
                <Field.Root invalid={!!errors.password}>
                  <Field.Label>New Password</Field.Label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    {...register('password')}
                    aria-label="New password"
                  />
                  <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.confirmPassword}>
                  <Field.Label>Confirm Password</Field.Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    {...register('confirmPassword')}
                    aria-label="Confirm password"
                  />
                  <Field.ErrorText>{errors.confirmPassword?.message}</Field.ErrorText>
                </Field.Root>

                <ModernButton
                  type="submit"
                  colorPalette="blue"
                  size="lg"
                  width="full"
                  loading={isLoading}
                  loadingText="Resetting..."
                >
                  Reset Password
                </ModernButton>

                <ModernButton asChild variant="ghost" width="full">
                  <Link to="/sign-in">Back to Sign In</Link>
                </ModernButton>
              </VStack>
            </form>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Container>
  );
}


